import OpenAI from "openai";
import type { ScoredTask } from "@/lib/schemas";
import type { Octokit } from "octokit";
import { getCommitDiffs } from "@/lib/github";

const client = new OpenAI();

interface CommitData {
  sha: string;
  message: string;
  date: string;
  filesChanged: string[];
}

/**
 * Score how well a recommended task predicted what the developer actually did.
 * When an octokit instance and repo info are provided, fetches actual code diffs
 * for a substantive comparison. Otherwise falls back to commit messages + filenames.
 * Returns 0-1 score.
 */
export async function scoreAccuracy(
  recommendedTask: ScoredTask,
  subsequentCommits: CommitData[],
  context?: { octokit: Octokit; owner: string; repo: string }
): Promise<number> {
  if (subsequentCommits.length === 0) return 0;

  // Fetch actual diffs if we have access
  let diffContent: string | null = null;
  if (context) {
    try {
      const diffs = await getCommitDiffs(
        context.octokit,
        context.owner,
        context.repo,
        subsequentCommits.slice(0, 8).map((c) => c.sha)
      );
      if (diffs.length > 0) {
        diffContent = diffs
          .map(
            (d) =>
              `[${d.sha}]\n${d.patches.map((p) => `--- ${p.filename} ---\n${p.patch}`).join("\n")}`
          )
          .join("\n\n");
        // Truncate to keep within token limits
        if (diffContent.length > 12000) {
          diffContent = diffContent.slice(0, 12000) + "\n... (truncated)";
        }
      }
    } catch {
      // Fall through to message-only scoring
    }
  }

  try {
    return await llmScoreAccuracy(recommendedTask, subsequentCommits, diffContent);
  } catch {
    return keywordScoreAccuracy(recommendedTask, subsequentCommits);
  }
}

async function llmScoreAccuracy(
  task: ScoredTask,
  commits: CommitData[],
  diffContent: string | null
): Promise<number> {
  const commitSummary = commits
    .slice(0, 15)
    .map(
      (c) =>
        `[${c.sha}] ${c.message.split("\n")[0]} (${c.filesChanged.slice(0, 5).join(", ")})`
    )
    .join("\n");

  const diffSection = diffContent
    ? `\n\nActual code changes (diffs):\n${diffContent}`
    : "";

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 200,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You score how well a recommended task matched what a developer actually worked on.

${diffContent ? "You have access to the actual code diffs — use them as the primary signal. Commit messages can be misleading; the code changes are ground truth." : "You only have commit messages and filenames. Score based on these."}

Respond with ONLY a JSON object: {"score": 0.0 to 1.0, "reason": "one sentence explaining what in the actual changes matched or didn't match the recommendation"}.

Score 0 if completely unrelated, 1 if the developer did exactly what was recommended. Focus on the substance of the changes, not just naming similarity.`,
      },
      {
        role: "user",
        content: `Recommended task: "${task.title}" — ${task.description}
Expected artifact: ${task.expectedArtifact}

What the developer actually committed:
${commitSummary}${diffSection}

Score how well the recommendation predicted the actual work. Focus on what the code changes actually do, not just file names or commit titles.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return keywordScoreAccuracy(task, commits);

  try {
    const parsed = JSON.parse(content);
    const score = Number(parsed.score);
    if (isNaN(score) || score < 0 || score > 1)
      return keywordScoreAccuracy(task, commits);
    return Math.round(score * 100) / 100;
  } catch {
    return keywordScoreAccuracy(task, commits);
  }
}

function keywordScoreAccuracy(
  task: ScoredTask,
  commits: CommitData[]
): number {
  const taskText = [
    task.title,
    task.description,
    task.whyNow,
    task.expectedArtifact,
  ]
    .join(" ")
    .toLowerCase();

  const stopWords = new Set([
    "this", "that", "with", "from", "have", "been", "will", "should", "would",
    "could", "about", "after", "before", "because", "when", "where", "which",
    "there", "their", "these", "those", "more", "than", "into", "also", "just",
    "some", "other", "them", "then", "what",
  ]);

  const taskWords = new Set(
    taskText.split(/\W+/).filter((w) => w.length > 3 && !stopWords.has(w))
  );

  if (taskWords.size === 0) return 0;

  const commitText = commits
    .map((c) => [c.message, ...c.filesChanged].join(" "))
    .join(" ")
    .toLowerCase();

  let matchCount = 0;
  for (const word of taskWords) {
    if (commitText.includes(word)) matchCount++;
  }

  return Math.round((matchCount / taskWords.size) * 100) / 100;
}
