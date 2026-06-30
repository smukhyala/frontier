import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { insertComparison, getComparisonsForUser } from "@/lib/db";
import { runEvaluation } from "@/lib/frontier/evaluation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { owner, repo, goal, deadline, notes } = body;

  if (!owner || !repo) {
    return NextResponse.json({ error: "owner and repo required" }, { status: 400 });
  }

  const comparisonId = nanoid(12);

  insertComparison({
    id: comparisonId,
    owner,
    repo,
    goal,
    deadline,
    notes,
    userId: session.user.id,
  });

  runEvaluation({
    comparisonId,
    owner,
    repo,
    goal,
    deadline,
    notes,
    accessToken: session.accessToken,
    userId: session.user.id,
  }).catch((error) => {
    console.error(`Evaluation ${comparisonId} failed:`, error);
  });

  return NextResponse.json({ comparisonId });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comparisons = getComparisonsForUser(session.user.id, 20);
  return NextResponse.json({ comparisons });
}
