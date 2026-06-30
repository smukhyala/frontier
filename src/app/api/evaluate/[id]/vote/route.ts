import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateComparisonVote, getComparison } from "@/lib/db";

export async function POST(
  request: NextRequest,
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

  const body = await request.json();
  const { winner, notes } = body;

  if (!["baseline", "frontier", "tie"].includes(winner)) {
    return NextResponse.json({ error: "winner must be baseline, frontier, or tie" }, { status: 400 });
  }

  updateComparisonVote(id, winner, notes);

  return NextResponse.json({ success: true });
}
