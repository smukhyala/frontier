import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOctokit, getRecentCommits, getReadme, getRepoInfo } from "@/lib/github";
import { callStructured } from "@/lib/llm";
import { z } from "zod";

const InferredGoalSchema = z.object({
  goal: z.string().describe("The inferred primary goal or purpose of this project in 1-2 sentences"),
  confidence: z.enum(["high", "medium", "low"]).describe("How confident the inference is"),
  signals: z.array(z.string()).describe("Key signals used to infer this goal (from README, commits, repo metadata)"),
  currentPhase: z.string().describe("What phase/stage the project appears to be in (e.g. early prototype, MVP, production, maintenance)"),
  recentFocus: z.string().describe("What the recent commits are focused on, in one sentence"),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo } = await params;
  const octokit = createOctokit(session.accessToken);

  const [repoInfo, commits, readme] = await Promise.all([
    getRepoInfo(octokit, owner, repo),
    getRecentCommits(octokit, owner, repo, 20),
    getReadme(octokit, owner, repo),
  ]);

  const commitSummary = commits
    .slice(0, 15)
    .map((c) => `[${c.date}] ${c.message}`)
    .join("\n");

  const result = await callStructured({
    system: `You infer the goal and current state of a software project from its metadata, README, and recent commits. Be specific and grounded in the actual data. Do not guess or hallucinate features not evidenced in the data.`,
    prompt: `Infer the primary goal of this project.

## Repository: ${repoInfo.name}
Description: ${repoInfo.description ?? "None"}
Language: ${repoInfo.language ?? "Unknown"}
Topics: ${repoInfo.topics.join(", ") || "None"}
Stars: ${repoInfo.stargazersCount} | Forks: ${repoInfo.forksCount}

## README
${readme ? readme.slice(0, 4000) : "No README found."}

## Recent Commits (last ${commits.length})
${commitSummary}

Based on all of this data, infer:
1. The primary goal/purpose of this project
2. Your confidence level
3. The key signals you used
4. What phase the project is in
5. What recent work has focused on`,
    schema: InferredGoalSchema,
    schemaName: "inferred_goal",
    maxTokens: 1024,
  });

  return NextResponse.json(result);
}
