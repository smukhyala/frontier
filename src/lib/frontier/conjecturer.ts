import { callStructured } from "@/lib/llm";
import {
  CandidateTasksSchema,
  type CandidateTask,
  type ProjectState,
} from "@/lib/schemas";

const CONJECTURER_SYSTEM = `You generate candidate next tasks for a software project. Be concise.

CRITICAL RULES:
- Every task MUST be traceable to specific evidence. The "whyNow" field must cite the exact source:
  - A commit message (quote it, e.g., 'Commit "Add Stripe SDK" added payment deps but no webhook handler')
  - A README section (e.g., 'README mentions "real-time updates" but no WebSocket code exists')
  - A gap between what's documented and what's built (e.g., 'README lists 5 API endpoints, only 3 exist in code')
- Tasks must be LOCAL CONTINUATIONS of recent work. Not generic. Not roadmap items.
- 30-120 minutes each. Diverse types. 8-12 tasks.
- Titles under 10 words. Descriptions one sentence.

ANTI-PATTERNS (zero tolerance):
- "Improve error handling" — where? which errors? cite the commit.
- "Add tests" — for what? which module? what broke?
- "Set up CI/CD" — generic, not project-specific
- Any task where whyNow could apply to any project`;

export async function runConjecturer(input: {
  projectState: ProjectState & { _commits?: { sha: string; message: string; date: string; filesChanged: string[] }[] };
  goal?: string;
  deadline?: string;
  notes?: string;
}): Promise<CandidateTask[]> {
  // Include actual commit messages so the LLM can cite them
  const commits = (input.projectState._commits ?? []).slice(0, 20);
  const commitLog = commits
    .map((c) => `[${c.sha}] ${c.message.split("\n")[0]}${c.filesChanged.length > 0 ? ` (${c.filesChanged.slice(0, 5).join(", ")})` : ""}`)
    .join("\n");

  const prompt = `Generate 8-12 candidate next tasks. Each task's "whyNow" must cite a specific commit or README section below.

## Project Summary
${input.projectState.summary}

## Recent Commits (cite these in whyNow)
${commitLog || "No commits available."}

## Inferred Frontier
${input.projectState.inferredFrontier}

## Active Workstreams
${input.projectState.activeWorkstreams.map((w) => `- ${w}`).join("\n")}

## Gaps
${input.projectState.likelyMissingPieces.map((m) => `- ${m}`).join("\n")}

## Tech Stack
${input.projectState.techStack.join(", ")}

${input.goal ? `## Goal\n${input.goal}\n` : ""}
${input.deadline ? `## Deadline\n${input.deadline}\n` : ""}
${input.notes ? `## Context\n${input.notes}\n` : ""}

For each task, the "whyNow" must start with evidence like:
- "Commit [sha] added X but didn't Y..."
- "README says X but the code only has Y..."
- "Recent commits to [file] suggest Z is next..."

Assign ids: task-1, task-2, etc.`;

  const result = await callStructured({
    system: CONJECTURER_SYSTEM,
    prompt,
    schema: CandidateTasksSchema,
    schemaName: "candidate_tasks",
    maxTokens: 6144,
  });

  return result.tasks;
}
