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
  fileActivity?: {
    topFiles: { path: string; editCount: number; firstSeen: string; lastEdited: string }[];
    areas: { area: string; editCount: number; fileCount: number }[];
    hotspots: string[];
  };
  completedTaskTitles?: string[];
  codeSnippets?: { path: string; content: string }[];
  todos?: { file: string; line: string; type: string }[];
  repoTree?: string[];
  branches?: { name: string; isDefault: boolean }[];
}

const HISTORIAN_SYSTEM = `You are a Software Project Historian, part of a Self-Guided Self-Play (SGS) inspired analysis pipeline.

Your role is analogous to understanding the current game state in SGS: you must accurately reconstruct what has been built, what is in progress, and where the project frontier lies.

Rules:
- Only state facts supported by the provided data.
- Mark uncertainty with "likely", "appears to", "possibly".
- Do NOT invent features not evidenced in the data.
- Focus on recent activity to infer trajectory and momentum.
- The "inferredFrontier" should describe the boundary between completed work and what naturally comes next.
- Be specific about file paths and feature names.
- Detect architectural patterns from file paths (e.g., src/components/ = React components, app/api/ = API routes, __tests__/ = test directory).
- Flag discrepancies between README claims and actual recent commit activity.
- Note any TODO/FIXME/HACK comments found in code snapshots.
- If branches are provided, note stale/abandoned feature branches.`;

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

${input.fileActivity ? `## File Activity Patterns
Most edited files: ${input.fileActivity.topFiles.slice(0, 10).map((f) => `${f.path} (${f.editCount}x)`).join(", ")}
Active areas: ${input.fileActivity.areas.slice(0, 5).map((a) => `${a.area}/ (${a.editCount} edits, ${a.fileCount} files)`).join(", ")}
${input.fileActivity.hotspots.length > 0 ? `Hotspots (3+ edits): ${input.fileActivity.hotspots.join(", ")}` : ""}` : ""}

${input.completedTaskTitles && input.completedTaskTitles.length > 0 ? `## Previously Completed Tasks (do not re-recommend these)\n${input.completedTaskTitles.map((t) => `- ${t}`).join("\n")}` : ""}

${input.codeSnippets && input.codeSnippets.length > 0 ? `## Code Snapshots (most-edited files)\n${input.codeSnippets.map((s) => `### ${s.path}\n\`\`\`\n${s.content.slice(0, 1000)}\n\`\`\``).join("\n\n")}` : ""}

${input.todos && input.todos.length > 0 ? `## TODOs & FIXMEs Found in Code\n${input.todos.map((t) => `- [${t.type}] ${t.file}: ${t.line}`).join("\n")}` : ""}

${input.repoTree && input.repoTree.length > 0 ? `## Repository File Structure (${input.repoTree.length} files)\n${input.repoTree.slice(0, 100).join("\n")}${input.repoTree.length > 100 ? `\n... and ${input.repoTree.length - 100} more files` : ""}` : ""}

${input.branches && input.branches.length > 1 ? `## Branches (${input.branches.length})\n${input.branches.map((b) => `- ${b.name}${b.isDefault ? " (default)" : ""}`).join("\n")}` : ""}

Based on this data, produce a structured assessment of the project's current state. Use the file activity patterns and code snapshots to understand what's being built, what patterns are used, and what's incomplete. Focus on inferring the project frontier.`;

  return callStructured({
    system: HISTORIAN_SYSTEM,
    prompt,
    schema: ProjectStateSchema,
    schemaName: "project_state",
    maxTokens: 6144,
    temperature: 0.3,
  });
}
