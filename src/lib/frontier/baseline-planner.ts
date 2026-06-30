import { callStructured } from "@/lib/llm";
import { z } from "zod";

export const BaselineRecommendationSchema = z.object({
  task: z.string().describe("Actionable task title, under 10 words"),
  description: z.string().describe("One sentence: what to do"),
  reasoning: z.string().describe("2-3 sentences: why this task"),
  estimatedMinutes: z.number().describe("30-120"),
  risks: z.array(z.string()).describe("Risks, each under 10 words"),
  definitionOfDone: z.array(z.string()).describe("Completion criteria, each under 10 words"),
  executionPlan: z.object({
    thirtyMinuteVersion: z.array(z.string()).describe("Steps, each under 15 words"),
    sixtyMinuteVersion: z.array(z.string()).describe("Steps, each under 15 words"),
    ninetyMinuteVersion: z.array(z.string()).describe("Steps, each under 15 words"),
  }),
});

export type BaselineRecommendation = z.infer<typeof BaselineRecommendationSchema>;

const BASELINE_SYSTEM = `You are a generic AI project planner.

You have NO access to:
- Git history or commits
- Source code or file structure
- README or documentation
- Issues or pull requests
- File activity or hotspots
- Any project state beyond what the user tells you

You only know:
- The user's goal
- The user's deadline (if any)
- Any notes the user provided

Based ONLY on this information, recommend the single best next task.
Be specific enough to be actionable, but recognize that without project context you must make reasonable assumptions.

Rules:
- Be concise. Steps under 15 words. Done criteria under 10 words. Risks under 10 words.
- The 30-minute version should be a meaningful subset
- Acknowledge uncertainty about project state where appropriate`;

export async function runBaselinePlanner(input: {
  goal?: string;
  deadline?: string;
  notes?: string;
}): Promise<BaselineRecommendation> {
  const prompt = `Recommend the single best next task for this project.

${input.goal ? `## Goal\n${input.goal}\n` : "## Goal\nNo specific goal provided. Suggest the most generally useful next step for a software project.\n"}
${input.deadline ? `## Deadline\n${input.deadline}\n` : ""}
${input.notes ? `## Additional Context\n${input.notes}\n` : ""}

You have NO access to the codebase, git history, issues, or any project state.
Based only on the goal and context above, what is the single best next task?
Provide a concrete execution plan with 30/60/90 minute variants.`;

  return callStructured({
    system: BASELINE_SYSTEM,
    prompt,
    schema: BaselineRecommendationSchema,
    schemaName: "baseline_recommendation",
    maxTokens: 4096,
    temperature: 0.5,
  });
}
