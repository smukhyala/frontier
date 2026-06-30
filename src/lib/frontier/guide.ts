import { callStructured } from "@/lib/llm";
import {
  ScoredTasksSchema,
  type CandidateTask,
  type ProjectState,
  type ScoredTask,
} from "@/lib/schemas";

const GUIDE_SYSTEM = `You are a Software Project Guide, part of a Self-Guided Self-Play (SGS) inspired analysis pipeline.

Your role is analogous to the Guide in SGS: you score candidate problems for quality and usefulness. In SGS, the Guide provides reward signals that prevent degenerate self-play. Here, you score candidate tasks to filter out busy work and surface genuinely valuable next steps.

## Scoring Dimensions (each 0-5):

1. **trajectoryFit** (0-5): Does this naturally follow from recent work?
   - 0: Completely disconnected from recent activity
   - 5: Perfect continuation of the current development arc

2. **deadlineRelevance** (0-5): Does this help hit the actual deadline?
   - 0: Irrelevant to deadline goals
   - 5: Critical path item for the deadline
   - Score 3 if no deadline was provided

3. **blockingPower** (0-5): Does this unlock future work?
   - 0: Dead end, nothing depends on it
   - 5: Major unblocker, many tasks depend on this

4. **informationGain** (0-5): Will completing it reveal useful information?
   - 0: We already know what we'd learn
   - 5: High discovery potential, will reshape understanding

5. **taskClarity** (0-5): Is it concrete and unambiguous?
   - 0: Vague hand-waving
   - 5: Crystal clear, could start immediately

6. **rightSized** (0-5): Can it be done in 30-120 minutes?
   - 0: Way too big or way too small
   - 5: Perfectly sized for a focused work session

7. **momentum** (0-5): Is it likely to produce visible progress?
   - 0: Invisible infrastructure work with no user-facing change
   - 5: Dramatic, demonstrable progress

## Penalties (reduce totalScore):
- Vague tasks: -3 to -5
- Tasks disconnected from recent commits: -2 to -4
- Fake productivity (renaming, trivial formatting): -5
- Huge roadmap items disguised as tasks: -3
- Tasks that sound impressive but don't unblock anything: -2

## totalScore Calculation:
Sum of all 7 dimension scores, minus any penalties. Range: 0-35.

Be ruthlessly honest in your critique and failureMode fields.`;

export async function runGuide(input: {
  projectState: ProjectState;
  candidateTasks: CandidateTask[];
  goal?: string;
  deadline?: string;
  previousAccuracy?: number;
  learningContext?: string;
  selfPlayExamples?: {
    completed: { taskTitle: string; taskType: string }[];
    skipped: { taskTitle: string; taskType: string }[];
  };
}): Promise<ScoredTask[]> {
  const taskList = input.candidateTasks
    .map(
      (t) =>
        `### ${t.id}: ${t.title}
Type: ${t.taskType} | Est: ${t.estimatedMinutes}min
Description: ${t.description}
Why now: ${t.whyNow}
Expected artifact: ${t.expectedArtifact}
Dependencies: ${t.dependencies.join(", ") || "None"}`
    )
    .join("\n\n");

  const prompt = `Score the following candidate tasks against the project state.

## Project State Summary
${input.projectState.summary}

## Inferred Frontier
${input.projectState.inferredFrontier}

## Recent Trajectory
${input.projectState.recentTrajectory.map((t) => `- ${t}`).join("\n")}

## Momentum: ${input.projectState.momentum}

${input.goal ? `## User's Goal\n${input.goal}\n` : ""}
${input.deadline ? `## Deadline\n${input.deadline}\n` : ""}
${input.previousAccuracy !== undefined ? `## Previous Recommendation Accuracy: ${Math.round(input.previousAccuracy * 100)}%\n${input.previousAccuracy < 0.3 ? "Previous recommendations did not match what was actually worked on. Favor tasks with higher trajectoryFit and taskClarity." : input.previousAccuracy > 0.7 ? "Previous recommendations were accurate. Continue with similar scoring approach." : ""}` : ""}

${input.learningContext ? `## Learning from Past Recommendations (embeddings-based)\n${input.learningContext}` : ""}

${input.selfPlayExamples && (input.selfPlayExamples.completed.length > 0 || input.selfPlayExamples.skipped.length > 0) ? `## Self-Play Reward Signal
This is the ground truth from user behavior. Use it to adjust your scoring.

${input.selfPlayExamples.completed.length > 0 ? `Tasks the user COMPLETED (reward=1, boost similar tasks by +2 to +3 on trajectoryFit and momentum):
${input.selfPlayExamples.completed.map((t) => `- "${t.taskTitle}" (${t.taskType})`).join("\n")}` : ""}

${input.selfPlayExamples.skipped.length > 0 ? `Tasks the user SKIPPED (reward=0, penalize similar tasks by -2 to -3 on trajectoryFit):
${input.selfPlayExamples.skipped.map((t) => `- "${t.taskTitle}" (${t.taskType})`).join("\n")}` : ""}` : ""}

## Candidate Tasks to Score

${taskList}

Score each task on all 7 dimensions. Be honest and critical. Calculate totalScore as the sum of all dimension scores. Provide a candid critique and the most likely failure mode for each task.`;

  const result = await callStructured({
    system: GUIDE_SYSTEM,
    prompt,
    schema: ScoredTasksSchema,
    schemaName: "scored_tasks",
    maxTokens: 8192,
    temperature: 0.4,
  });

  // Sort by totalScore descending
  return result.scoredTasks.sort((a, b) => b.totalScore - a.totalScore);
}
