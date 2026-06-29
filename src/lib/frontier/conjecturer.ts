import { callStructured } from "@/lib/llm";
import {
  CandidateTasksSchema,
  type CandidateTask,
  type ProjectState,
} from "@/lib/schemas";

const CONJECTURER_SYSTEM = `You are a Software Project Conjecturer, part of a Self-Guided Self-Play (SGS) inspired analysis pipeline.

Your role is analogous to the Conjecturer in SGS: you generate candidate problems (tasks) that are useful stepping stones for the project. In SGS, the Conjecturer generates synthetic subproblems that help the Solver improve. Here, you generate candidate next tasks that advance the project.

Rules for good candidate tasks:
- Tasks must be LOCAL CONTINUATIONS of recent work, not generic roadmap items.
- Each task should be completable in 30-120 minutes by a single developer.
- Tasks should be useful stepping stones that unblock future work.
- Tasks should NOT be too easy (trivial cleanup) or too ambitious (full feature redesign).
- Each task must reference specific aspects of the current project state.
- Include a diverse mix: implementation, debugging, testing, refactoring, documentation.
- Generate exactly 8-12 tasks.
- The "whyNow" field must explain why this is the right moment for this task based on the trajectory.

Anti-patterns to avoid:
- "Improve error handling everywhere" (too vague)
- "Rewrite the entire auth system" (too large)
- "Add a comment to file X" (too trivial)
- "Set up CI/CD" (generic, not project-specific)
- Tasks disconnected from what was recently worked on`;

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
