import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createOctokit, getUserRepos } from "@/lib/github";
import { getRecentCompletedRuns } from "@/lib/db";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getLearningSignal } from "@/lib/frontier/embeddings";
import { getModelStats } from "@/lib/frontier/scoring-model";
import type { FrontierRecommendation, ScoredTask } from "@/lib/schemas";

export interface FrontierCard {
  id: string;
  owner: string;
  repo: string;
  taskTitle: string;
  taskType: string;
  score: number;
  estimatedMinutes: number;
  reasoning: string;
  description: string;
  whyNow: string;
  completedAt: string;
  deadline?: string;
}

export interface ScheduleTask {
  id: string;
  analysisId: string;
  repo: string;
  title: string;
  taskType: string;
  estimatedMinutes: number;
  score: number;
  description: string;
  whyNow: string;
  deadline?: string;
  isFrontierPick: boolean;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.accessToken || !session?.user?.id) {
    redirect("/");
  }

  const octokit = createOctokit(session.accessToken);
  const repos = await getUserRepos(octokit);
  const recentRuns = getRecentCompletedRuns(session.user.id, 5);

  const frontierCards: FrontierCard[] = [];
  const scheduleTasks: ScheduleTask[] = [];

  for (const run of recentRuns) {
    try {
      const planner = JSON.parse(run.planner_output!) as FrontierRecommendation;
      const guide = JSON.parse(run.guide_output!) as ScoredTask[];
      const selected = guide.find((t) => t.id === planner.selectedTaskId) ?? guide[0];
      if (!selected) continue;

      frontierCards.push({
        id: run.id,
        owner: run.owner,
        repo: run.repo,
        taskTitle: selected.title,
        taskType: selected.taskType as string,
        score: selected.totalScore,
        estimatedMinutes: selected.estimatedMinutes,
        reasoning: planner.reasoning,
        description: selected.description,
        whyNow: selected.whyNow,
        completedAt: run.completed_at ?? run.created_at,
        deadline: run.deadline ?? undefined,
      });

      // Pull top scored tasks from this run for the schedule
      const topTasks = guide
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 5);
      for (const task of topTasks) {
        scheduleTasks.push({
          id: task.id,
          analysisId: run.id,
          repo: run.repo,
          title: task.title,
          taskType: task.taskType as string,
          estimatedMinutes: task.estimatedMinutes,
          score: task.totalScore,
          description: task.description,
          whyNow: task.whyNow,
          deadline: run.deadline ?? undefined,
          isFrontierPick: task.id === planner.selectedTaskId,
        });
      }
    } catch {
      continue;
    }
  }

  // Compute accuracy stats
  const accuracyScores = recentRuns
    .map((r) => (r as unknown as Record<string, unknown>).accuracy_score as number | null)
    .filter((s): s is number => s !== null && s !== undefined);

  const accuracyData = accuracyScores.length >= 2
    ? {
        overall: accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length,
        count: accuracyScores.length,
        trend: (accuracyScores[0] > accuracyScores[accuracyScores.length - 1] + 0.1
          ? "improving"
          : accuracyScores[0] < accuracyScores[accuracyScores.length - 1] - 0.1
            ? "declining"
            : "stable") as "improving" | "stable" | "declining",
      }
    : null;

  // Get learning signal from embeddings
  let learningData = { totalTasks: 0, completedTasks: 0, avgAccuracy: null as number | null, successfulTypes: [] as string[], failedTypes: [] as string[] };
  try {
    // Aggregate across all repos with recent runs
    const repos_with_runs = [...new Set(recentRuns.map((r) => `${r.owner}/${r.repo}`))];
    for (const key of repos_with_runs) {
      const [o, r] = key.split("/");
      const signal = getLearningSignal(o, r);
      learningData.totalTasks += signal.totalTasks;
      learningData.completedTasks += signal.completedTasks;
      if (signal.avgAccuracy !== null) learningData.avgAccuracy = signal.avgAccuracy;
      learningData.successfulTypes.push(...signal.successfulTypes);
      learningData.failedTypes.push(...signal.failedTypes);
    }
    learningData.successfulTypes = [...new Set(learningData.successfulTypes)];
    learningData.failedTypes = [...new Set(learningData.failedTypes)];
  } catch {}

  // Get model stats
  let modelData: { trained: boolean; samples: number; accuracy: number | null; loss: number | null } | null = null;
  try {
    const repos_with_runs = [...new Set(recentRuns.map((r) => `${r.owner}/${r.repo}`))];
    for (const key of repos_with_runs) {
      const [o, r] = key.split("/");
      const stats = getModelStats(o, r);
      if (stats?.trained) { modelData = stats; break; }
    }
  } catch {}

  return (
    <DashboardView
      repos={repos}
      frontierCards={frontierCards}
      scheduleTasks={scheduleTasks}
      accuracyData={accuracyData}
      learningData={learningData}
      modelData={modelData}
    />
  );
}
