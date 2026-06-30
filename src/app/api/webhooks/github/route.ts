import { NextRequest, NextResponse } from "next/server";
import { getWebhookConfig } from "@/lib/db";
import { runPipeline } from "@/lib/frontier/pipeline";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const event = request.headers.get("x-github-event");
  if (event !== "push") {
    return NextResponse.json({ ignored: true, event });
  }

  // Verify signature
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("x-hub-signature-256");
    const body = await request.text();
    const expected =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(body).digest("hex");

    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse body manually since we already consumed it
    const payload = JSON.parse(body);
    return handlePush(payload);
  }

  // No secret configured, still accept but parse normally
  const payload = await request.json();
  return handlePush(payload);
}

async function handlePush(payload: Record<string, unknown>) {
  const repo = payload.repository as Record<string, unknown> | undefined;
  if (!repo) {
    return NextResponse.json({ error: "No repository in payload" }, { status: 400 });
  }

  const owner = (repo.owner as Record<string, unknown>)?.login as string ??
    (repo.owner as Record<string, unknown>)?.name as string;
  const repoName = repo.name as string;

  if (!owner || !repoName) {
    return NextResponse.json({ error: "Could not parse owner/repo" }, { status: 400 });
  }

  // Look up webhook config for this repo
  const config = getWebhookConfig(owner, repoName);
  if (!config) {
    return NextResponse.json({ error: "No webhook config for this repo" }, { status: 404 });
  }

  // Trigger pipeline
  const { nanoid } = require("nanoid");
  const analysisId = nanoid(12);

  runPipeline({
    analysisId,
    owner,
    repo: repoName,
    accessToken: config.access_token,
    userId: config.user_id,
  }).catch((err) => {
    console.error(`Webhook pipeline ${analysisId} failed:`, err);
  });

  return NextResponse.json({ analysisId, triggered: true });
}
