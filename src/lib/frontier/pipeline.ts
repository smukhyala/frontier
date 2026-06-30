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
import { storeTaskEmbedding, findSimilarTasks, getLearningSignal, getSelfPlayExamples, getEmbedding } from "./embeddings";
import { trainScoringModel, scoreWithModel, loadModel, type ScoringModel } from "./scoring-model";
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
          previousAccuracy = await scoreAccuracy(prevTask, commits, {
            octokit,
            owner,
            repo,
          });
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

    // ── Self-play examples: past task outcomes as reward signal ──
    let selfPlayExamples: { completed: { taskTitle: string; taskDescription: string; taskType: string }[]; skipped: { taskTitle: string; taskDescription: string; taskType: string }[] } = { completed: [], skipped: [] };
    try {
      selfPlayExamples = getSelfPlayExamples(owner, repo);
    } catch {}

    // ── Stage 2: Conjecturer ──
    emit({ stage: "conjecturer", status: "running" });
    let candidateTasks: CandidateTask[];
    try {
      candidateTasks = await runConjecturer({
        projectState: { ...projectState, _commits: commits.slice(0, 20), _fileActivity: fileActivity, _codeSnippets: codeSnippets, _todos: todos },
        goal,
        deadline,
        notes,
        selfPlayExamples,
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

    // ── Train scoring model on accumulated outcome data ──
    let scoringModel: ScoringModel | null = null;
    try {
      const trainResult = await trainScoringModel(owner, repo);
      if (trainResult) {
        scoringModel = trainResult.model;
        console.log(`Scoring model trained: ${trainResult.accuracy * 100}% accuracy on ${trainResult.model.trainingSamples} samples, loss=${trainResult.loss.toFixed(4)}`);
      } else {
        scoringModel = loadModel(owner, repo);
      }
    } catch {
      // Non-critical
    }

    // ── Embeddings: find similar past tasks + learning signal ──
    let learningContext: string | undefined;
    try {
      const learningSignal = getLearningSignal(owner, repo);
      const taskTexts = candidateTasks.map((t) => `${t.title}. ${t.description}`).join(" | ");
      const similarTasks = await findSimilarTasks(taskTexts, owner, repo, 5);

      const parts: string[] = [];
      if (learningSignal.totalTasks > 0) {
        parts.push(`Based on ${learningSignal.totalTasks} past tasks (${learningSignal.completedTasks} completed):`);
        if (learningSignal.successfulTypes.length > 0) {
          parts.push(`User tends to complete: ${learningSignal.successfulTypes.join(", ")} tasks`);
        }
        if (learningSignal.failedTypes.length > 0) {
          parts.push(`User tends to skip: ${learningSignal.failedTypes.join(", ")} tasks`);
        }
        if (learningSignal.avgAccuracy !== null) {
          parts.push(`Historical accuracy: ${Math.round(learningSignal.avgAccuracy * 100)}%`);
        }
      }
      const completedSimilar = similarTasks.filter((t) => (t.outcome === "completed" || t.outcome === "started") && t.similarity > 0.7);
      const skippedSimilar = similarTasks.filter((t) => t.outcome === "skipped" && t.similarity > 0.7);
      if (completedSimilar.length > 0) {
        parts.push(`Similar tasks the user actually did: ${completedSimilar.map((t) => `"${t.taskTitle}" (${Math.round(t.similarity * 100)}% similar)`).join(", ")}`);
      }
      if (skippedSimilar.length > 0) {
        parts.push(`Similar tasks the user skipped: ${skippedSimilar.map((t) => `"${t.taskTitle}"`).join(", ")}`);
      }
      if (parts.length > 0) {
        learningContext = parts.join("\n");
      }
    } catch {
      // Non-critical — proceed without learning context
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
        selfPlayExamples,
        learningContext,
      });
      // ── Re-rank using trained scoring model ──
      if (scoringModel?.trained) {
        try {
          const reranked = await Promise.all(
            scoredTasks.map(async (task) => {
              const taskText = `${task.title}. ${task.description}. Type: ${task.taskType}`;
              const embedding = await getEmbedding(taskText);
              const modelScore = scoreWithModel(scoringModel!, embedding, task.taskType, task.scores);
              // Blend: 70% guide score + 30% model prediction (scaled to 0-35)
              const blendedScore = Math.round(task.totalScore * 0.7 + modelScore * 35 * 0.3);
              return { ...task, totalScore: blendedScore, _modelScore: modelScore };
            })
          );
          scoredTasks = reranked.sort((a, b) => b.totalScore - a.totalScore);
          console.log(`Model re-ranked tasks. Top: "${scoredTasks[0].title}" (blended=${scoredTasks[0].totalScore})`);
        } catch {
          // Fall back to guide-only ranking
        }
      }

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

    // ── Store embeddings for learning ──
    try {
      const selectedTask = scoredTasks.find((t) => t.id === recommendation.selectedTaskId) ?? scoredTasks[0];
      if (selectedTask) {
        await storeTaskEmbedding({
          owner,
          repo,
          userId,
          taskTitle: selectedTask.title,
          taskDescription: selectedTask.description,
          taskType: selectedTask.taskType,
          outcome: "recommended",
          projectContext: projectState.inferredFrontier,
        });
      }
      // Store top 3 non-selected tasks too (as "recommended" — outcome updates later)
      for (const task of scoredTasks.slice(0, 3)) {
        if (task.id !== recommendation.selectedTaskId) {
          await storeTaskEmbedding({
            owner,
            repo,
            userId,
            taskTitle: task.title,
            taskDescription: task.description,
            taskType: task.taskType,
            outcome: "recommended",
            projectContext: projectState.inferredFrontier,
          }).catch(() => {});
        }
      }
    } catch {
      // Non-critical
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
