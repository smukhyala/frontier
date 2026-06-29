import { callStructured } from "@/lib/llm";
import {
  FrontierRecommendationSchema,
  type FrontierRecommendation,
  type ProjectState,
  type ScoredTask,
} from "@/lib/schemas";

const PLANNER_SYSTEM = `You are a Software Project Planner, the final stage of a Self-Guided Self-Play (SGS) inspired analysis pipeline.

Your role is analogous to the Solver in SGS choosing the best problem to tackle: you select the single highest-leverage task and produce a concrete execution plan.

The previous stages have:
1. Historian: Reconstructed the project's current state from git history
2. Conjecturer: Generated candidate next tasks
3. Guide: Scored and critiqued each candidate

Now you must:
1. Select the BEST task (usually the highest-scored, but you may override if you have strong reasoning)
2. Produce a concrete, step-by-step execution plan in three time variants (30/60/90 minutes)
3. Define clear "definition of done" criteria
4. Identify risks and missing context
5. Draft a GitHub issue for the selected task

Rules:
- The execution plan must be concrete enough to start immediately
- Reference specific files, functions, or components from the project state when possible
- The 30-minute version should be a meaningful subset, not just "step 1"
- Each time variant should build on the previous one
- Risks should be actionable, not generic
- The GitHub issue should be well-formatted markdown`;

export async function runPlanner(input: {
  projectState: ProjectState;
  scoredTasks: ScoredTask[];
  goal?: string;
}): Promise<FrontierRecommendation> {
  // Give the planner the top 5 tasks to choose from
  const topTasks = input.scoredTasks.slice(0, 5);

  const taskDetails = topTasks
    .map(
      (t, i) =>
        `### ${i + 1}. ${t.title} (Score: ${t.totalScore}/35)
ID: ${t.id}
Type: ${t.taskType} | Est: ${t.estimatedMinutes}min
Description: ${t.description}
Why now: ${t.whyNow}
Expected artifact: ${t.expectedArtifact}

Scores:
- Trajectory Fit: ${t.scores.trajectoryFit}/5
- Deadline Relevance: ${t.scores.deadlineRelevance}/5
- Blocking Power: ${t.scores.blockingPower}/5
- Information Gain: ${t.scores.informationGain}/5
- Task Clarity: ${t.scores.taskClarity}/5
- Right Sized: ${t.scores.rightSized}/5
- Momentum: ${t.scores.momentum}/5

Critique: ${t.critique}
Failure Mode: ${t.failureMode}`
    )
    .join("\n\n");

  const prompt = `Select the best task and create a detailed execution plan.

## Project State
${input.projectState.summary}

## Inferred Frontier
${input.projectState.inferredFrontier}

## Tech Stack
${input.projectState.techStack.join(", ")}

${input.goal ? `## User's Goal\n${input.goal}\n` : ""}

## Top Scored Tasks

${taskDetails}

Select the single best task to work on next. Create a detailed execution plan with 30/60/90 minute variants. The plan should be specific enough that a developer could start working immediately.

Format the GitHub issue body in clean markdown with sections for Context, Task, Steps, and Acceptance Criteria.`;

  return callStructured({
    system: PLANNER_SYSTEM,
    prompt,
    schema: FrontierRecommendationSchema,
    schemaName: "frontier_recommendation",
    maxTokens: 6144,
  });
}
