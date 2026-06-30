import { EventEmitter } from "events";
import {
  insertRun,
  updateRunStage,
  updateRunStatus,
  getCompletedTasksForRepo,
  getLatestCompletedRun,
  updateAccuracyScore,
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
import { analyzeFileActivity, extractTodos } from "./file-analysis";
import { scoreAccuracy } from "./accuracy";
import type { ProjectState, CandidateTask, ScoredTask, FrontierRecommendation } from "@/lib/schemas";

export type PipelineStage = "historian" | "conjecturer" | "guide" | "planner";
export type PipelineStatus = "running" | "complete" | "error";

export interface PipelineEvent {
  stage: PipelineStage;
  status: PipelineStatus;
  data?: unknown;
  error?: string;
}

// Module-level emitter map for SSE streaming
export const pipelineEmitters = new Map<string, EventEmitter>();

interface PipelineParams {
  analysisId: string;
  owner: string;
  repo: string;
  goal?: string;
  deadline?: string;
  notes?: string;
  depth?: string;
  accessToken: string;
  userId: string;
}

export async function runPipeline(params: PipelineParams): Promise<void> {
  const {
    analysisId,
    owner,
    repo,
    goal,
    deadline,
    notes,
    depth,
    accessToken,
    userId,
  } = params;

  // Create emitter for this run
  const emitter = new EventEmitter();
  pipelineEmitters.set(analysisId, emitter);

  // Create DB record
  insertRun({
    id: analysisId,
    owner,
    repo,
    goal,
    deadline,
    notes,
    depth,
    userId,
  });

  const emit = (event: PipelineEvent) => {
    emitter.emit("event", event);
  };

  try {
    // ── Fetch GitHub data ──
    emit({ stage: "historian", status: "running" });

    const octokit = createOctokit(accessToken);
    const commitCount = depth === "deep" ? 50 : depth === "light" ? 15 : 30;

    const [repoInfo, commits, readme, issues, pullRequests, repoTree, branches] =
      await Promise.all([
        getRepoInfo(octokit, owner, repo),
        getRecentCommits(octokit, owner, repo, commitCount),
        getReadme(octokit, owner, repo),
        getOpenIssues(octokit, owner, repo),
        getRecentPullRequests(octokit, owner, repo),
        getRepoTree(octokit, owner, repo),
        getBranches(octokit, owner, repo),
      ]);

    // ── File Activity Analysis (pure computation, no LLM) ──
    const fileActivity = analyzeFileActivity(commits);

    // ── Code Scanning: fetch contents of most-edited files ──
    const hotFiles = fileActivity.topFiles.slice(0, 6).map((f) => f.path);
    const codeSnippets = await getFileContents(octokit, owner, repo, hotFiles);

    // ── TODO/FIXME extraction from code ──
    const todos = extractTodos(codeSnippets);

    // ── Completed tasks from previous runs ──
    const completedTasks = getCompletedTasksForRepo(owner, repo, userId);
    const completedTaskTitles = completedTasks.map((t) => t.title);

    // ── Accuracy scoring: compare previous recommendation to what was actually done ──
    let previousAccuracy: number | undefined;
    const previousRun = getLatestCompletedRun(owner, repo, userId);
    if (previousRun?.planner_output) {
      try {
        const prevPlanner = JSON.parse(previousRun.planner_output) as FrontierRecommendation;
        const prevGuide = JSON.parse(previousRun.guide_output!) as ScoredTask[];
        const prevTask = prevGuide.find((t) => t.id === prevPlanner.selectedTaskId) ?? prevGuide[0];
        if (prevTask) {
          previousAccuracy = await scoreAccuracy(prevTask, commits);
          updateAccuracyScore(previousRun.id, previousAccuracy);
        }
      } catch {
        // Skip accuracy if parsing fails
      }
    }

    // ── Stage 1: Historian ──
    let projectState: ProjectState;
    try {
      projectState = await runHistorian({
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
        completedTaskTitles,
        codeSnippets,
        todos,
        repoTree,
        branches,
      });
      const historianPayload = { ...projectState, _commits: commits.slice(0, 20), _fileActivity: fileActivity };
      updateRunStage(analysisId, "historian", JSON.stringify(historianPayload));
      emit({ stage: "historian", status: "complete", data: historianPayload });
    } catch (error) {
      emit({
        stage: "historian",
        status: "error",
        error: String(error),
      });
      throw error;
    }

    // ── Stage 2: Conjecturer ──
    emit({ stage: "conjecturer", status: "running" });
    let candidateTasks: CandidateTask[];
    try {
      candidateTasks = await runConjecturer({
        projectState: { ...projectState, _commits: commits.slice(0, 20), _fileActivity: fileActivity, _codeSnippets: codeSnippets, _todos: todos },
        goal,
        deadline,
        notes,
      });
      updateRunStage(
        analysisId,
        "conjecturer",
        JSON.stringify(candidateTasks)
      );
      emit({
        stage: "conjecturer",
        status: "complete",
        data: candidateTasks,
      });
    } catch (error) {
      emit({
        stage: "conjecturer",
        status: "error",
        error: String(error),
      });
      throw error;
    }

    // ── Stage 3: Guide ──
    emit({ stage: "guide", status: "running" });
    let scoredTasks: ScoredTask[];
    try {
      scoredTasks = await runGuide({
        projectState,
        candidateTasks,
        goal,
        deadline,
        previousAccuracy,
      });
      updateRunStage(analysisId, "guide", JSON.stringify(scoredTasks));
      emit({ stage: "guide", status: "complete", data: scoredTasks });
    } catch (error) {
      emit({
        stage: "guide",
        status: "error",
        error: String(error),
      });
      throw error;
    }

    // ── Stage 4: Planner ──
    emit({ stage: "planner", status: "running" });
    let recommendation: FrontierRecommendation;
    try {
      recommendation = await runPlanner({
        projectState,
        scoredTasks,
        goal,
      });
      updateRunStage(
        analysisId,
        "planner",
        JSON.stringify(recommendation)
      );
      emit({
        stage: "planner",
        status: "complete",
        data: recommendation,
      });
    } catch (error) {
      emit({
        stage: "planner",
        status: "error",
        error: String(error),
      });
      throw error;
    }

    // ── Complete ──
    updateRunStatus(analysisId, "completed");
    emitter.emit("done");
  } catch (error) {
    updateRunStatus(analysisId, "failed", String(error));
    emitter.emit("done");
  } finally {
    // Clean up emitter after a delay to allow SSE clients to receive final events
    setTimeout(() => {
      pipelineEmitters.delete(analysisId);
    }, 30000);
  }
}
