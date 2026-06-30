import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getComparison, updateComparisonOutcome } from "@/lib/db";
import { createOctokit, getRecentCommits, getOpenIssues } from "@/lib/github";
import { evaluateOutcome } from "@/lib/frontier/evaluation";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.accessToken || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comparison = getComparison(id);
  if (!comparison || comparison.status !== "completed") {
    return NextResponse.json({ error: "Comparison not found or not completed" }, { status: 404 });
  }

  if (!comparison.baseline_json || !comparison.frontier_json) {
    return NextResponse.json({ error: "Missing planner outputs" }, { status: 400 });
  }

  const baseline = JSON.parse(comparison.baseline_json);
  const frontier = JSON.parse(comparison.frontier_json);

  // Fetch current state of repo to compare
  const octokit = createOctokit(session.accessToken);
  const [commits, issues] = await Promise.all([
    getRecentCommits(octokit, comparison.owner, comparison.repo, 20),
    getOpenIssues(octokit, comparison.owner, comparison.repo, 20),
  ]);

  // Filter commits to only those after the comparison was created
  const comparisonDate = new Date(comparison.created_at);
  const subsequentCommits = commits.filter(
    (c) => new Date(c.date) > comparisonDate
  );

  const outcomeScore = await evaluateOutcome({
    baselineTask: baseline.task,
    baselineDescription: baseline.description,
    frontierTask: frontier.selectedTask?.title ?? frontier.recommendation?.selectedTaskId ?? "",
    frontierDescription: frontier.selectedTask?.description ?? "",
    commits: subsequentCommits,
    issues: issues.map((i) => ({ number: i.number, title: i.title, state: "open" })),
  });

  updateComparisonOutcome(
    id,
    outcomeScore.baselineScore,
    outcomeScore.frontierScore,
    JSON.stringify(outcomeScore)
  );

  return NextResponse.json(outcomeScore);
}
