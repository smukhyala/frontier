import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompletedRunsForRepo } from "@/lib/db";
import type { FrontierRecommendation, ScoredTask } from "@/lib/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo } = await params;
  const runs = getCompletedRunsForRepo(owner, repo, session.user.id);

  const history = runs
    .map((run) => {
      try {
        const planner = JSON.parse(run.planner_output!) as FrontierRecommendation;
        const guide = JSON.parse(run.guide_output!) as ScoredTask[];
        const selected =
          guide.find((t) => t.id === planner.selectedTaskId) ?? guide[0];
        if (!selected) return null;
        return {
          analysisId: run.id,
          date: run.completed_at ?? run.created_at,
          taskTitle: selected.title,
          taskType: selected.taskType,
          score: selected.totalScore,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return NextResponse.json(history);
}
