import { EventEmitter } from "events";
import {
  insertRun,
  updateRunStage,
  updateRunStatus,
} from "@/lib/db";
import {
  createOctokit,
  getRecentCommits,
  getReadme,
  getOpenIssues,
  getRecentPullRequests,
  getRepoInfo,
} from "@/lib/github";
import { runHistorian } from "./historian";
import { runConjecturer } from "./conjecturer";
import { runGuide } from "./guide";
import { runPlanner } from "./planner";
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

    const [repoInfo, commits, readme, issues, pullRequests] =
      await Promise.all([
        getRepoInfo(octokit, owner, repo),
        getRecentCommits(octokit, owner, repo, commitCount),
        getReadme(octokit, owner, repo),
        getOpenIssues(octokit, owner, repo),
        getRecentPullRequests(octokit, owner, repo),
      ]);

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
      });
      updateRunStage(analysisId, "historian", JSON.stringify(projectState));
      emit({ stage: "historian", status: "complete", data: projectState });
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
        projectState,
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
