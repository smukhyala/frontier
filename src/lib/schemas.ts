import { z } from "zod";

// ── Historian Output ──

export const ProjectStateSchema = z.object({
  summary: z.string().describe("2-4 sentence summary of the project. Be concise."),
  recentTrajectory: z
    .array(z.string())
    .describe("Recent dev activities, 5-8 words each, most recent first"),
  completedCapabilities: z
    .array(z.string())
    .describe("What's built. Short phrases, 5-8 words each."),
  activeWorkstreams: z
    .array(z.string())
    .describe("Work in progress. Short phrases."),
  likelyMissingPieces: z
    .array(z.string())
    .describe("Gaps or incomplete work. Short phrases."),
  blockers: z
    .array(z.string())
    .describe("Blocking issues. Short phrases."),
  uncertainty: z
    .array(z.string())
    .describe("Uncertain areas. Short phrases."),
  inferredFrontier: z
    .string()
    .describe("1-2 sentences: the boundary between done and what comes next"),
  techStack: z
    .array(z.string())
    .describe("Technologies detected"),
  momentum: z
    .enum(["stalled", "slow", "steady", "active", "rapid"])
    .describe("Development momentum"),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;

// ── Conjecturer Output ──

export const CandidateTaskSchema = z.object({
  id: z.string().describe("task-1, task-2, etc."),
  title: z.string().describe("Actionable task title, under 10 words"),
  description: z
    .string()
    .describe("One sentence: what to do"),
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
    ]),
  estimatedMinutes: z.number().describe("30-120"),
  whyNow: z
    .string()
    .describe("One sentence: why this task now, referencing specific recent commits or README sections"),
  expectedArtifact: z
    .string()
    .describe("What exists when done, under 10 words"),
  dependencies: z.array(z.string()).describe("Prerequisites, short phrases"),
});

export type CandidateTask = z.infer<typeof CandidateTaskSchema>;

export const CandidateTasksSchema = z.object({
  tasks: z.array(CandidateTaskSchema).min(8).max(12),
});

// ── Guide Output ──

export const TaskScoresSchema = z.object({
  trajectoryFit: z.number().min(0).max(5).describe("0=disconnected, 5=perfect continuation"),
  deadlineRelevance: z.number().min(0).max(5).describe("0=irrelevant, 5=critical path"),
  blockingPower: z.number().min(0).max(5).describe("0=dead end, 5=major unblocker"),
  informationGain: z.number().min(0).max(5).describe("0=known, 5=high discovery"),
  taskClarity: z.number().min(0).max(5).describe("0=vague, 5=crystal clear"),
  rightSized: z.number().min(0).max(5).describe("0=wrong size, 5=perfect"),
  momentum: z.number().min(0).max(5).describe("0=invisible, 5=dramatic progress"),
});

export type TaskScores = z.infer<typeof TaskScoresSchema>;

export const ScoredTaskSchema = CandidateTaskSchema.extend({
  scores: TaskScoresSchema,
  totalScore: z.number().describe("Sum of all scores"),
  critique: z.string().describe("One sentence: main weakness"),
  failureMode: z.string().describe("One sentence: how this could waste time"),
});

export type ScoredTask = z.infer<typeof ScoredTaskSchema>;

export const ScoredTasksSchema = z.object({
  scoredTasks: z.array(ScoredTaskSchema),
});

// ── Planner Output ──

export const FrontierRecommendationSchema = z.object({
  selectedTaskId: z.string(),
  reasoning: z.string().describe("2-3 sentences: why this task over alternatives"),
  goalConnection: z.string().describe("One sentence: how this task moves toward the user's goal or deadline. If no goal/deadline given, explain how it advances the project's natural trajectory."),
  genericAlternative: z.string().describe("One sentence: what a generic AI planner would suggest instead for this project, and why that would be worse right now"),
  executionPlan: z.object({
    thirtyMinuteVersion: z.array(z.string()).describe("Steps, each under 15 words"),
    sixtyMinuteVersion: z.array(z.string()).describe("Steps, each under 15 words"),
    ninetyMinuteVersion: z.array(z.string()).describe("Steps, each under 15 words"),
  }),
  definitionOfDone: z.array(z.string()).describe("Completion criteria, each under 10 words"),
  risks: z.array(z.string()).describe("Risks, each under 10 words"),
  missingContext: z.array(z.string()).describe("Missing info, each under 10 words"),
  suggestedGitHubIssue: z.object({
    title: z.string(),
    body: z.string().describe("Concise GitHub issue body in markdown"),
    labels: z.array(z.string()),
  }),
});

export type FrontierRecommendation = z.infer<typeof FrontierRecommendationSchema>;

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
