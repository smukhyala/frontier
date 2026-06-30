import OpenAI from "openai";
import type { ScoredTask } from "@/lib/schemas";

const client = new OpenAI();

interface CommitData {
  sha: string;
  message: string;
  date: string;
  filesChanged: string[];
}

/**
 * Score how well a recommended task predicted what the developer actually did.
 * Uses an LLM call for semantic matching, falls back to keyword matching.
 * Returns 0-1 score.
 */
export async function scoreAccuracy(
  recommendedTask: ScoredTask,
  subsequentCommits: CommitData[]
): Promise<number> {
  if (subsequentCommits.length === 0) return 0;

  // Try LLM-based scoring first
  try {
    return await llmScoreAccuracy(recommendedTask, subsequentCommits);
  } catch {
    // Fall back to keyword matching
    return keywordScoreAccuracy(recommendedTask, subsequentCommits);
  }
}

async function llmScoreAccuracy(
  task: ScoredTask,
  commits: CommitData[]
): Promise<number> {
  const commitSummary = commits
    .slice(0, 15)
    .map((c) => `[${c.sha}] ${c.message.split("\n")[0]} (${c.filesChanged.slice(0, 5).join(", ")})`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 100,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You score how well a recommended task matched what a developer actually worked on. Respond with ONLY a JSON object: {\"score\": 0.0 to 1.0, \"reason\": \"one sentence\"}. Score 0 if completely unrelated, 1 if the developer did exactly what was recommended.",
      },
      {
        role: "user",
        content: `Recommended task: "${task.title}" — ${task.description}

What the developer actually committed:
${commitSummary}

Score how well the recommendation predicted the actual work.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return keywordScoreAccuracy(task, commits);

  try {
    const parsed = JSON.parse(content);
    const score = Number(parsed.score);
    if (isNaN(score) || score < 0 || score > 1) return keywordScoreAccuracy(task, commits);
    return Math.round(score * 100) / 100;
  } catch {
    return keywordScoreAccuracy(task, commits);
  }
}

function keywordScoreAccuracy(
  task: ScoredTask,
  commits: CommitData[]
): number {
  const taskText = [task.title, task.description, task.whyNow, task.expectedArtifact]
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
