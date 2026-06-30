import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getComparison } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comparison = getComparison(id);

  if (!comparison) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...comparison,
    baseline_json: comparison.baseline_json ? JSON.parse(comparison.baseline_json) : null,
    frontier_json: comparison.frontier_json ? JSON.parse(comparison.frontier_json) : null,
    diff_json: comparison.diff_json ? JSON.parse(comparison.diff_json) : null,
    outcome_json: comparison.outcome_json ? JSON.parse(comparison.outcome_json) : null,
  });
}
