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
  if (!run || run.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!run.planner_output) {
    return NextResponse.json({ error: "Analysis not complete" }, { status: 400 });
  }

  const recommendation = JSON.parse(run.planner_output) as FrontierRecommendation;
  const octokit = createOctokit(session.accessToken);
  const result = await createGitHubIssue(
    octokit,
    run.owner,
    run.repo,
    recommendation.suggestedGitHubIssue.title,
    recommendation.suggestedGitHubIssue.body,
    recommendation.suggestedGitHubIssue.labels
  );

  // Store issue number for auto-close later
  if (result.number) {
    try {
      const Database = require("better-sqlite3");
      const path = require("path");
      const db = new Database(path.join(process.cwd(), "data", "frontier.db"));
      try { db.exec("ALTER TABLE analysis_runs ADD COLUMN github_issue_number INTEGER"); } catch {}
      db.prepare("UPDATE analysis_runs SET github_issue_number = ? WHERE id = ?").run(result.number, id);
    } catch {}
  }

  return NextResponse.json(result);
}
