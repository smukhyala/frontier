import { callStructured } from "@/lib/llm";
import { ProjectStateSchema, type ProjectState } from "@/lib/schemas";

interface HistorianInput {
  repoInfo: {
    name: string;
    description: string | null;
    language: string | null;
    topics: string[];
    defaultBranch: string;
  };
  commits: {
    sha: string;
    message: string;
    author: string;
    date: string;
    filesChanged: string[];
  }[];
  readme: string | null;
  issues: {
    number: number;
    title: string;
    body: string;
    labels: string[];
  }[];
  pullRequests: {
    number: number;
    title: string;
    state: string;
    mergedAt: string | null;
    body: string;
  }[];
  goal?: string;
  deadline?: string;
  notes?: string;
}

const HISTORIAN_SYSTEM = `You are a Software Project Historian, part of a Self-Guided Self-Play (SGS) inspired analysis pipeline.

Your role is analogous to understanding the current game state in SGS: you must accurately reconstruct what has been built, what is in progress, and where the project frontier lies.

Rules:
- Only state facts that are supported by the provided data (commits, README, issues, PRs).
- Clearly mark anything uncertain with qualifiers like "likely", "appears to", "possibly".
- Do NOT invent features, files, or capabilities not evidenced in the data.
- Focus on recent activity to infer trajectory and momentum.
- The "inferredFrontier" should describe the boundary between completed work and what naturally comes next.
- Be specific about file paths, feature names, and technical details when the data supports it.`;

export async function runHistorian(input: HistorianInput): Promise<ProjectState> {
  const commitLog = input.commits
    .map(
      (c) =>
        `[${c.sha}] ${c.date} by ${c.author}: ${c.message}${
          c.filesChanged.length > 0
            ? `\n  Files: ${c.filesChanged.slice(0, 10).join(", ")}${c.filesChanged.length > 10 ? ` (+${c.filesChanged.length - 10} more)` : ""}`
            : ""
        }`
    )
    .join("\n\n");

  const issuesList = input.issues
    .map(
      (i) =>
        `#${i.number}: ${i.title}${i.labels.length > 0 ? ` [${i.labels.join(", ")}]` : ""}${i.body ? `\n  ${i.body.slice(0, 200)}` : ""}`
    )
    .join("\n");

  const prList = input.pullRequests
    .map(
      (pr) =>
        `#${pr.number}: ${pr.title} (${pr.state}${pr.mergedAt ? ", merged" : ""})`
    )
    .join("\n");

  const prompt = `Analyze this GitHub repository and reconstruct its current project state.

## Repository: ${input.repoInfo.name}
${input.repoInfo.description ? `Description: ${input.repoInfo.description}` : ""}
Language: ${input.repoInfo.language ?? "Unknown"}
Topics: ${input.repoInfo.topics.join(", ") || "None"}

${input.goal ? `## User's Stated Goal\n${input.goal}\n` : ""}
${input.deadline ? `## Deadline\n${input.deadline}\n` : ""}
${input.notes ? `## Additional Context\n${input.notes}\n` : ""}

## README
${input.readme ? input.readme.slice(0, 3000) : "No README found."}

## Recent Commits (${input.commits.length} commits)
${commitLog}

## Open Issues (${input.issues.length})
${issuesList || "No open issues."}

## Recent Pull Requests (${input.pullRequests.length})
${prList || "No recent pull requests."}

Based on this data, produce a structured assessment of the project's current state. Focus on inferring the project frontier—the boundary between what is done and what naturally should come next.`;

  return callStructured({
    system: HISTORIAN_SYSTEM,
    prompt,
    schema: ProjectStateSchema,
    schemaName: "project_state",
    maxTokens: 4096,
  });
}
