import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRun, setGitHubIssueNumber } from "@/lib/db";
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
  if (!run || run.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!run.planner_output) {
    return NextResponse.json({ error: "Analysis not complete" }, { status: 400 });
  }

  const recommendation = JSON.parse(run.planner_output) as FrontierRecommendation;
  const octokit = createOctokit(session.accessToken);

  let result;
  try {
    result = await createGitHubIssue(
      octokit,
      run.owner,
      run.repo,
      recommendation.suggestedGitHubIssue.title,
      recommendation.suggestedGitHubIssue.body,
      recommendation.suggestedGitHubIssue.labels
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create GitHub issue: ${msg}` },
      { status: 502 }
    );
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Store issue number for auto-close later
  if (result.number) {
    try {
      setGitHubIssueNumber(id, result.number);
    } catch {}
  }

  return NextResponse.json(result);
}
