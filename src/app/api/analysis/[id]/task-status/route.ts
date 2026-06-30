import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRun, upsertTaskStatus, getTaskStatusesForAnalysis } from "@/lib/db";
import { createOctokit } from "@/lib/github";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const statuses = getTaskStatusesForAnalysis(id);
  return NextResponse.json(statuses);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const run = getRun(id);
  if (!run || run.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { taskId, title, status } = body;
  if (!taskId || !status || !["started", "done", "skipped"].includes(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  upsertTaskStatus({
    analysisId: id,
    taskId,
    owner: run.owner,
    repo: run.repo,
    userId: session.user.id,
    title: title ?? "",
    status,
  });

  // Auto-close GitHub issue when task is marked done
  if (status === "done" && session.accessToken) {
    try {
      const issueNum = (run as unknown as Record<string, unknown>).github_issue_number as number | null;
      if (issueNum) {
        const octokit = createOctokit(session.accessToken);
        await octokit.rest.issues.update({
          owner: run.owner,
          repo: run.repo,
          issue_number: issueNum,
          state: "closed",
        });
      }
    } catch {
      // Non-critical — don't fail the status update
    }
  }

  return NextResponse.json({ success: true });
}
