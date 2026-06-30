import { callStructured } from "@/lib/llm";
import {
  CandidateTasksSchema,
  type CandidateTask,
  type ProjectState,
} from "@/lib/schemas";

const CONJECTURER_SYSTEM = `You generate candidate next tasks for a software project. Be extremely concise in all output.

Rules:
- Tasks must be LOCAL CONTINUATIONS of recent commits, not generic roadmap items.
- Each "whyNow" MUST reference a specific recent commit message or README section that motivates this task.
- 30-120 minutes each. Not trivial, not massive.
- Diverse mix of types. 8-12 tasks.
- Keep all text fields short: titles under 10 words, descriptions one sentence, whyNow one sentence with specific evidence.

Anti-patterns (zero tolerance):
- Generic tasks like "improve error handling" or "add tests"
- Tasks disconnected from the actual commit history
- Roadmap items disguised as tasks`;

export async function runConjecturer(input: {
  projectState: ProjectState;
  goal?: string;
  deadline?: string;
  notes?: string;
}): Promise<CandidateTask[]> {
  const prompt = `Based on the following project state, generate 8-12 candidate next tasks.

## Project State Summary
${input.projectState.summary}

## Recent Trajectory
${input.projectState.recentTrajectory.map((t) => `- ${t}`).join("\n")}

## Completed Capabilities
${input.projectState.completedCapabilities.map((c) => `- ${c}`).join("\n")}

## Active Workstreams
${input.projectState.activeWorkstreams.map((w) => `- ${w}`).join("\n")}

## Likely Missing Pieces
${input.projectState.likelyMissingPieces.map((m) => `- ${m}`).join("\n")}

## Blockers
${input.projectState.blockers.map((b) => `- ${b}`).join("\n")}

## Inferred Frontier
${input.projectState.inferredFrontier}

## Tech Stack
${input.projectState.techStack.join(", ")}

## Momentum: ${input.projectState.momentum}

${input.goal ? `## User's Goal\n${input.goal}\n` : ""}
${input.deadline ? `## Deadline\n${input.deadline}\n` : ""}
${input.notes ? `## Additional Context\n${input.notes}\n` : ""}

Generate 8-12 candidate tasks that are natural next steps from the current frontier. Each task should be a concrete, actionable piece of work that a developer could start immediately. Prioritize tasks that continue the current momentum and trajectory.

Assign each task an id like "task-1", "task-2", etc.`;

  const result = await callStructured({
    system: CONJECTURER_SYSTEM,
    prompt,
    schema: CandidateTasksSchema,
    schemaName: "candidate_tasks",
    maxTokens: 6144,
  });

  return result.tasks;
}
