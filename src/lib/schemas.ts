import { z } from "zod";

// ── Historian Output ──

export const ProjectStateSchema = z.object({
  summary: z.string().describe("2-3 paragraph summary of the project's current state"),
  recentTrajectory: z
    .array(z.string())
    .describe("Key recent development activities, most recent first"),
  completedCapabilities: z
    .array(z.string())
    .describe("Features/capabilities that appear to be built and working"),
  activeWorkstreams: z
    .array(z.string())
    .describe("Work that appears to be in progress or recently active"),
  likelyMissingPieces: z
    .array(z.string())
    .describe("Gaps, missing features, or incomplete work inferred from the codebase"),
  blockers: z
    .array(z.string())
    .describe("Issues or problems that may be blocking progress"),
  uncertainty: z
    .array(z.string())
    .describe("Areas where the analysis is uncertain - clearly marked"),
  inferredFrontier: z
    .string()
    .describe(
      "The inferred frontier: the boundary between what is done and what naturally comes next"
    ),
  techStack: z
    .array(z.string())
    .describe("Technologies and frameworks detected in the project"),
  momentum: z
    .enum(["stalled", "slow", "steady", "active", "rapid"])
    .describe("Overall development momentum"),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;

// ── Conjecturer Output ──

export const CandidateTaskSchema = z.object({
  id: z.string().describe("Unique task identifier like task-1, task-2, etc."),
  title: z.string().describe("Clear, actionable task title"),
  description: z
    .string()
    .describe("1-2 sentence description of what needs to be done"),
  taskType: z
    .enum([
      "implementation",
      "debugging",
      "evaluation",
      "refactor",
      "documentation",
      "research",
      "design",
      "testing",
    ])
    .describe("Category of work"),
  estimatedMinutes: z
    .number()
    .describe("Estimated time to complete in minutes (30-120)"),
  whyNow: z
    .string()
    .describe("Why this task is the right thing to do at this moment"),
  expectedArtifact: z
    .string()
    .describe("What will exist when this task is done"),
  dependencies: z
    .array(z.string())
    .describe("What must be true or done before starting this"),
});

export type CandidateTask = z.infer<typeof CandidateTaskSchema>;

export const CandidateTasksSchema = z.object({
  tasks: z.array(CandidateTaskSchema).min(8).max(12),
});

// ── Guide Output ──

export const TaskScoresSchema = z.object({
  trajectoryFit: z
    .number()
    .min(0)
    .max(5)
    .describe("Does this naturally follow from recent work? 0=disconnected, 5=perfect continuation"),
  deadlineRelevance: z
    .number()
    .min(0)
    .max(5)
    .describe("Does this help hit the actual deadline? 0=irrelevant, 5=critical path"),
  blockingPower: z
    .number()
    .min(0)
    .max(5)
    .describe("Does this unlock future work? 0=dead end, 5=major unblocker"),
  informationGain: z
    .number()
    .min(0)
    .max(5)
    .describe("Will completing it reveal useful information? 0=no, 5=high discovery"),
  taskClarity: z
    .number()
    .min(0)
    .max(5)
    .describe("Is it concrete and unambiguous? 0=vague, 5=crystal clear"),
  rightSized: z
    .number()
    .min(0)
    .max(5)
    .describe("Can it be done in 30-120 minutes? 0=way off, 5=perfectly sized"),
  momentum: z
    .number()
    .min(0)
    .max(5)
    .describe("Is it likely to produce visible progress? 0=invisible, 5=dramatic"),
});

export type TaskScores = z.infer<typeof TaskScoresSchema>;

export const ScoredTaskSchema = CandidateTaskSchema.extend({
  scores: TaskScoresSchema,
  totalScore: z.number().describe("Weighted sum of all scores"),
  critique: z.string().describe("Honest assessment of this task's weaknesses"),
  failureMode: z
    .string()
    .describe("Most likely way this task could go wrong or waste time"),
});

export type ScoredTask = z.infer<typeof ScoredTaskSchema>;

export const ScoredTasksSchema = z.object({
  scoredTasks: z.array(ScoredTaskSchema),
});

// ── Planner Output ──

export const FrontierRecommendationSchema = z.object({
  selectedTaskId: z.string().describe("ID of the selected task"),
  reasoning: z
    .string()
    .describe("Why this task was selected over the alternatives"),
  executionPlan: z.object({
    thirtyMinuteVersion: z
      .array(z.string())
      .describe("Steps for a 30-minute version of this task"),
    sixtyMinuteVersion: z
      .array(z.string())
      .describe("Steps for a 60-minute version"),
    ninetyMinuteVersion: z
      .array(z.string())
      .describe("Steps for a 90-minute version"),
  }),
  definitionOfDone: z
    .array(z.string())
    .describe("Concrete criteria for when this task is complete"),
  risks: z.array(z.string()).describe("What could go wrong"),
  missingContext: z
    .array(z.string())
    .describe("Information that would help but is not available"),
  suggestedGitHubIssue: z.object({
    title: z.string(),
    body: z.string().describe("GitHub-flavored markdown issue body"),
    labels: z.array(z.string()),
  }),
});

export type FrontierRecommendation = z.infer<
  typeof FrontierRecommendationSchema
>;

// ── Analysis Input ──

export const AnalysisInputSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  goal: z.string().optional(),
  deadline: z.string().optional(),
  notes: z.string().optional(),
  depth: z.enum(["light", "standard", "deep"]).default("standard"),
});

export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;
