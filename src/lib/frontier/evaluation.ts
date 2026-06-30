import { EventEmitter } from "events";
import { nanoid } from "nanoid";
import {
  insertComparison,
  updateComparisonBaseline,
  updateComparisonFrontier,
  updateComparisonDiff,
  updateComparisonStatus,
} from "@/lib/db";
import {
  createOctokit,
  getRecentCommits,
  getReadme,
  getOpenIssues,
  getFileContents,
  getRepoTree,
  getBranches,
  getRecentPullRequests,
  getRepoInfo,
} from "@/lib/github";
import { runHistorian } from "./historian";
import { runConjecturer } from "./conjecturer";
import { runGuide } from "./guide";
import { runPlanner } from "./planner";
import { runBaselinePlanner } from "./baseline-planner";
import { analyzeFileActivity, extractTodos } from "./file-analysis";
import { callStructured } from "@/lib/llm";
import { z } from "zod";
import type {
  ProjectState,
  ScoredTask,
  FrontierRecommendation,
} from "@/lib/schemas";

export type EvalStage =
  | "baseline"
  | "github"
  | "historian"
  | "conjecturer"
  | "guide"
  | "planner"
  | "diff";
export type EvalStatus = "running" | "complete" | "error";

export interface EvalEvent {
  stage: EvalStage;
  status: EvalStatus;
  data?: unknown;
  error?: string;
}

export const evalEmitters = new Map<string, EventEmitter>();

interface EvalParams {
  comparisonId: string;
  owner: string;
  repo: string;
  goal?: string;
  deadline?: string;
  notes?: string;
  accessToken: string;
  userId: string;
}

const DiffAnalysisSchema = z.object({
  summary: z
    .string()
    .describe(
      "2-3 sentences: what additional information Frontier used that changed the recommendation"
    ),
  additionalSignals: z
    .array(
      z.object({
        signal: z
          .string()
          .describe(
            "What Frontier saw that Baseline did not (e.g., specific commit, file activity pattern)"
          ),
        impact: z
          .string()
          .describe("How this signal changed the recommendation"),
      })
    )
    .describe("3-5 specific signals"),
  verdict: z
    .string()
    .describe(
      "One sentence: are the recommendations meaningfully different, and why?"
    ),
});

export type DiffAnalysis = z.infer<typeof DiffAnalysisSchema>;

export async function runEvaluation(params: EvalParams): Promise<void> {
  const { comparisonId, owner, repo, goal, deadline, notes, accessToken, userId } =
    params;

  const emitter = new EventEmitter();
  evalEmitters.set(comparisonId, emitter);

  const emit = (event: EvalEvent) => {
    emitter.emit("event", event);
  };

  try {
    // ── Run baseline planner (no repo context) ──
    emit({ stage: "baseline", status: "running" });
    const baselineResult = await runBaselinePlanner({ goal, deadline, notes });
    updateComparisonBaseline(comparisonId, JSON.stringify(baselineResult));
    emit({ stage: "baseline", status: "complete", data: baselineResult });

    // ── Fetch GitHub data for Frontier ──
    emit({ stage: "github", status: "running" });
    const octokit = createOctokit(accessToken);

    const [repoInfo, commits, readme, issues, pullRequests, repoTree, branches] =
      await Promise.all([
        getRepoInfo(octokit, owner, repo),
        getRecentCommits(octokit, owner, repo, 30),
        getReadme(octokit, owner, repo),
        getOpenIssues(octokit, owner, repo),
        getRecentPullRequests(octokit, owner, repo),
        getRepoTree(octokit, owner, repo),
        getBranches(octokit, owner, repo),
      ]);

    const fileActivity = analyzeFileActivity(commits);
    const hotFiles = fileActivity.topFiles.slice(0, 6).map((f) => f.path);
    const codeSnippets = await getFileContents(octokit, owner, repo, hotFiles);
    const todos = extractTodos(codeSnippets);
    emit({ stage: "github", status: "complete" });

    // ── Stage 1: Historian ──
    emit({ stage: "historian", status: "running" });
    const projectState: ProjectState = await runHistorian({
      repoInfo: {
        name: repoInfo.name,
        description: repoInfo.description,
        language: repoInfo.language,
        topics: repoInfo.topics,
        defaultBranch: repoInfo.defaultBranch,
      },
      commits,
      readme,
      issues,
      pullRequests,
      goal,
      deadline,
      notes,
      fileActivity,
      codeSnippets,
      todos,
      repoTree,
      branches,
    });
    emit({ stage: "historian", status: "complete", data: projectState });

    // ── Stage 2: Conjecturer ──
    emit({ stage: "conjecturer", status: "running" });
    const candidateTasks = await runConjecturer({
      projectState: {
        ...projectState,
        _commits: commits.slice(0, 20),
        _fileActivity: fileActivity,
        _codeSnippets: codeSnippets,
        _todos: todos,
      },
      goal,
      deadline,
      notes,
    });
    emit({ stage: "conjecturer", status: "complete", data: candidateTasks });

    // ── Stage 3: Guide ──
    emit({ stage: "guide", status: "running" });
    const scoredTasks: ScoredTask[] = await runGuide({
      projectState,
      candidateTasks,
      goal,
      deadline,
    });
    emit({ stage: "guide", status: "complete", data: scoredTasks });

    // ── Stage 4: Planner ──
    emit({ stage: "planner", status: "running" });
    const frontierResult: FrontierRecommendation = await runPlanner({
      projectState,
      scoredTasks,
      goal,
    });

    const selectedTask =
      scoredTasks.find((t) => t.id === frontierResult.selectedTaskId) ??
      scoredTasks[0];

    const frontierOutput = {
      recommendation: frontierResult,
      selectedTask,
      projectState,
    };

    updateComparisonFrontier(comparisonId, JSON.stringify(frontierOutput));
    emit({ stage: "planner", status: "complete", data: frontierOutput });

    // ── Generate diff analysis ──
    emit({ stage: "diff", status: "running" });

    const diffAnalysis = await callStructured({
      system:
        "You compare two AI planner recommendations for the same project. Be concrete and specific. Reference commits, files, workstreams, or inferred project state whenever possible. Do not invent facts.",
      prompt: `Compare these two task recommendations for the repository ${owner}/${repo}.

## Baseline Planner (no project context)
Task: ${baselineResult.task}
Description: ${baselineResult.description}
Reasoning: ${baselineResult.reasoning}

## Frontier Planner (full project context)
Task: ${selectedTask.title}
Description: ${selectedTask.description}
Reasoning: ${frontierResult.reasoning}
Goal Connection: ${frontierResult.goalConnection}

## Context Available to Frontier
Project Summary: ${projectState.summary}
Recent Trajectory: ${projectState.recentTrajectory.join("; ")}
Inferred Frontier: ${projectState.inferredFrontier}
Active Workstreams: ${projectState.activeWorkstreams.join("; ")}
Momentum: ${projectState.momentum}

## Evidence Chain
${selectedTask.evidenceChain.map((e) => `- [${e.type}] ${e.detail}`).join("\n")}

Explain exactly what additional information Frontier used that changed the recommendation. Be concrete.`,
      schema: DiffAnalysisSchema,
      schemaName: "diff_analysis",
      maxTokens: 2048,
      temperature: 0.3,
    });

    updateComparisonDiff(comparisonId, JSON.stringify(diffAnalysis));
    emit({ stage: "diff", status: "complete", data: diffAnalysis });

    // ── Complete ──
    updateComparisonStatus(comparisonId, "completed");
    emitter.emit("done");
  } catch (error) {
    updateComparisonStatus(comparisonId, "failed", String(error));
    emitter.emit("done");
  } finally {
    setTimeout(() => {
      evalEmitters.delete(comparisonId);
    }, 30000);
  }
}

// ── Outcome evaluation ──

const OutcomeScoreSchema = z.object({
  baselineScore: z.number().describe("0-100: how well the baseline recommendation predicted actual work"),
  frontierScore: z.number().describe("0-100: how well the frontier recommendation predicted actual work"),
  baselineExplanation: z.string().describe("One sentence: why this score for baseline"),
  frontierExplanation: z.string().describe("One sentence: why this score for frontier"),
});

export type OutcomeScore = z.infer<typeof OutcomeScoreSchema>;

export async function evaluateOutcome(input: {
  baselineTask: string;
  baselineDescription: string;
  frontierTask: string;
  frontierDescription: string;
  commits: { sha: string; message: string; filesChanged: string[] }[];
  issues: { number: number; title: string; state: string }[];
  diffs?: { sha: string; patches: { filename: string; patch: string }[] }[];
}): Promise<OutcomeScore> {
  const commitSummary = input.commits
    .slice(0, 20)
    .map(
      (c) =>
        `[${c.sha}] ${c.message.split("\n")[0]} (${c.filesChanged.slice(0, 5).join(", ")})`
    )
    .join("\n");

  const issueSummary = input.issues
    .slice(0, 10)
    .map((i) => `#${i.number}: ${i.title} (${i.state})`)
    .join("\n");

  let diffSection = "";
  if (input.diffs && input.diffs.length > 0) {
    let diffText = input.diffs
      .map(
        (d) =>
          `[${d.sha}]\n${d.patches.map((p) => `--- ${p.filename} ---\n${p.patch}`).join("\n")}`
      )
      .join("\n\n");
    if (diffText.length > 12000) {
      diffText = diffText.slice(0, 12000) + "\n... (truncated)";
    }
    diffSection = `\n\n### Actual Code Changes (diffs)\n${diffText}`;
  }

  const hasDiffs = diffSection.length > 0;

  return callStructured({
    system: `You are evaluating whether AI planners accurately predicted the user's next work. Score each recommendation from 0-100 based on how well it matched what actually happened.

${hasDiffs ? "You have access to the actual code diffs. Use these as the PRIMARY signal — they show the substance of what was built. Commit messages can be vague or misleading; the code changes are ground truth." : "You only have commit messages and filenames."}

Be fair and consistent. Focus on what the code changes actually accomplish, not surface-level naming similarity.`,
    prompt: `## Baseline Recommendation
Task: ${input.baselineTask}
Description: ${input.baselineDescription}

## Frontier Recommendation
Task: ${input.frontierTask}
Description: ${input.frontierDescription}

## What Actually Happened

### Subsequent Commits
${commitSummary || "No subsequent commits found."}

### Issue Updates
${issueSummary || "No issue updates found."}${diffSection}

Score each recommendation 0-100 based on how well it predicted the actual work. Focus on the substance of the code changes.`,
    schema: OutcomeScoreSchema,
    schemaName: "outcome_score",
    model: "gpt-4o-mini",
    maxTokens: 1024,
    temperature: 0.2,
  });
}
