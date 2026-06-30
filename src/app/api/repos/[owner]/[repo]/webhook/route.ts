import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  upsertWebhookConfig,
  getWebhookConfig,
  deleteWebhookConfig,
} from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo } = await params;
  const config = getWebhookConfig(owner, repo);
  return NextResponse.json({ enabled: !!config });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const session = await auth();
  if (!session?.accessToken || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo } = await params;
  upsertWebhookConfig({
    owner,
    repo,
    userId: session.user.id,
    accessToken: session.accessToken,
  });

  return NextResponse.json({ enabled: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo } = await params;
  deleteWebhookConfig(owner, repo);
  return NextResponse.json({ enabled: false });
}
