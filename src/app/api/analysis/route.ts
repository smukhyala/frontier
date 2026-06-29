import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { AnalysisInputSchema } from "@/lib/schemas";
import { runPipeline } from "@/lib/frontier/pipeline";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AnalysisInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const analysisId = nanoid(12);

  // Fire and forget - pipeline runs in background
  runPipeline({
    analysisId,
    owner: parsed.data.owner,
    repo: parsed.data.repo,
    goal: parsed.data.goal,
    deadline: parsed.data.deadline,
    notes: parsed.data.notes,
    depth: parsed.data.depth,
    accessToken: session.accessToken,
    userId: session.user.id,
  }).catch((error) => {
    console.error(`Pipeline ${analysisId} failed:`, error);
  });

  return NextResponse.json({ analysisId });
}
