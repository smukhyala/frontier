import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRun } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const run = getRun(id);
  if (!run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (run.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: run.id,
    owner: run.owner,
    repo: run.repo,
    goal: run.goal,
    deadline: run.deadline,
    notes: run.notes,
    depth: run.depth,
    status: run.status,
    currentStage: run.current_stage,
    historianOutput: run.historian_output
      ? JSON.parse(run.historian_output)
      : null,
    conjecturerOutput: run.conjecturer_output
      ? JSON.parse(run.conjecturer_output)
      : null,
    guideOutput: run.guide_output ? JSON.parse(run.guide_output) : null,
    plannerOutput: run.planner_output
      ? JSON.parse(run.planner_output)
      : null,
    error: run.error,
    createdAt: run.created_at,
    completedAt: run.completed_at,
  });
}
