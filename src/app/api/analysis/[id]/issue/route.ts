import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRun } from "@/lib/db";
import { createOctokit, createGitHubIssue } from "@/lib/github";
import type { FrontierRecommendation } from "@/lib/schemas";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.accessToken || !session?.user?.id) {
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

  if (!run.planner_output) {
    return NextResponse.json(
      { error: "Analysis not complete" },
      { status: 400 }
    );
  }

  const recommendation = JSON.parse(
    run.planner_output
  ) as FrontierRecommendation;

  const octokit = createOctokit(session.accessToken);
  const result = await createGitHubIssue(
    octokit,
    run.owner,
    run.repo,
    recommendation.suggestedGitHubIssue.title,
    recommendation.suggestedGitHubIssue.body,
    recommendation.suggestedGitHubIssue.labels
  );

  return NextResponse.json(result);
}
