import { callStructured } from "@/lib/llm";
import {
  CandidateTasksSchema,
  type CandidateTask,
  type ProjectState,
} from "@/lib/schemas";

const CONJECTURER_SYSTEM = `You generate candidate next tasks for a software project. Be concise.

CRITICAL RULES:
- Every task needs an evidenceChain with 2-4 entries. Each entry traces WHY this task exists:
  - "commit" — cite a specific commit SHA and what it did/didn't do
  - "file" — cite specific file paths and patterns (e.g., "src/auth/ edited 5 times but no tests exist alongside")
  - "readme" — cite what the README promises vs what the code delivers
  - "goal" — tie to the user's stated goal or deadline
  - "gap" — identify something missing between what exists and what's needed
- Tasks must be LOCAL CONTINUATIONS of recent work. Not generic. Not roadmap items.
- Think about what files were recently edited, what patterns the file names suggest, and what the sequence of commits implies about the developer's intent.
- 30-120 minutes each. Diverse types. 8-12 tasks.
- Titles under 10 words. Descriptions one sentence.

ANTI-PATTERNS (zero tolerance):
- "Improve error handling" — where? which errors? cite the file.
- "Add tests" — for what? which module? what broke?
- "Set up CI/CD" — generic, not project-specific
- Any task where the evidenceChain could apply to any project
- Tasks with vague evidence like "based on recent activity" — name the specific commits/files

EXAMPLE GOOD TASKS:

Example 1 (implementation):
{
  "title": "Wire up Stripe webhook endpoint",
  "description": "Create POST /api/webhooks/stripe to handle payment confirmations.",
  "taskType": "implementation",
  "estimatedMinutes": 60,
  "whyNow": "Stripe SDK was added in commit a3f1c2 but no webhook handler exists.",
  "evidenceChain": [
    {"type": "commit", "detail": "Commit a3f1c2 added stripe package to dependencies"},
    {"type": "file", "detail": "src/lib/stripe.ts exists with client init but no webhook verification"},
    {"type": "gap", "detail": "Payment flow has no server-side confirmation — charges could go untracked"}
  ],
  "expectedArtifact": "Working webhook endpoint with signature verification",
  "dependencies": ["Stripe API key configured"]
}

Example 2 (debugging):
{
  "title": "Fix cart state race condition",
  "description": "Add optimistic locking to prevent duplicate items when clicking fast.",
  "taskType": "debugging",
  "estimatedMinutes": 45,
  "whyNow": "Commit b7e4d1 added concurrent add-to-cart but no mutex.",
  "evidenceChain": [
    {"type": "commit", "detail": "Commit b7e4d1 'add to cart from product page' uses setState without lock"},
    {"type": "file", "detail": "src/hooks/useCart.ts has no debounce or optimistic update pattern"},
    {"type": "code_comment", "detail": "TODO in useCart.ts: 'handle rapid clicks'"}
  ],
  "expectedArtifact": "Cart updates are atomic, no duplicate items",
  "dependencies": []
}`;

interface FileActivityData {
  topFiles: { path: string; editCount: number }[];
  areas: { area: string; editCount: number; fileCount: number }[];
  hotspots: string[];
}

export async function runConjecturer(input: {
  projectState: ProjectState & {
    _commits?: { sha: string; message: string; date: string; filesChanged: string[] }[];
    _fileActivity?: FileActivityData;
    _codeSnippets?: { path: string; content: string }[];
    _todos?: { file: string; line: string; type: string }[];
  };
  goal?: string;
  deadline?: string;
  notes?: string;
}): Promise<CandidateTask[]> {
  const commits = (input.projectState._commits ?? []).slice(0, 20);
  const codeSnippets = input.projectState._codeSnippets ?? [];
  const todos = input.projectState._todos ?? [];
  const commitLog = commits
    .map((c) => `[${c.sha}] ${c.message.split("\n")[0]}${c.filesChanged.length > 0 ? ` (${c.filesChanged.slice(0, 5).join(", ")})` : ""}`)
    .join("\n");

  const fa = input.projectState._fileActivity;

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

${fa ? `## File Activity (which files are being worked on most)
Active areas: ${fa.areas.slice(0, 5).map((a) => `${a.area}/ (${a.editCount} edits across ${a.fileCount} files)`).join(", ")}
${fa.hotspots.length > 0 ? `Hotspot files (edited 3+ times): ${fa.hotspots.join(", ")}` : ""}
Most edited: ${fa.topFiles.slice(0, 8).map((f) => f.path).join(", ")}` : ""}

${codeSnippets.length > 0 ? `## Code from Most-Edited Files (use this to understand what's actually built)\n${codeSnippets.slice(0, 4).map((s) => `### ${s.path}\n\`\`\`\n${s.content.slice(0, 800)}\n\`\`\``).join("\n\n")}` : ""}

${todos.length > 0 ? `## TODOs & FIXMEs in Code (use as evidence type "code_comment")\n${todos.map((t) => `- [${t.type}] ${t.file}: ${t.line}`).join("\n")}` : ""}

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
    temperature: 0.8,
  });

  return result.tasks;
}
