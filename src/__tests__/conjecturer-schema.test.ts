import { describe, it, expect } from "vitest";
import { CandidateTaskSchema, CandidateTasksSchema } from "@/lib/schemas";

describe("Conjecturer schema validation", () => {
  const validTask = {
    id: "task-1",
    title: "Add webhook endpoint",
    description: "Create POST /api/webhooks/stripe for payment confirmations.",
    taskType: "implementation",
    estimatedMinutes: 60,
    whyNow: "Stripe SDK added in commit a3f1c2 but no webhook exists.",
    evidenceChain: [
      { type: "commit" as const, detail: "Commit a3f1c2 added stripe package" },
      { type: "gap" as const, detail: "No server-side payment confirmation" },
    ],
    expectedArtifact: "Working webhook endpoint",
    dependencies: ["Stripe API key"],
  };

  it("should accept valid candidate task", () => {
    const result = CandidateTaskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it("should reject task missing evidenceChain", () => {
    const { evidenceChain, ...noEvidence } = validTask;
    const result = CandidateTaskSchema.safeParse(noEvidence);
    expect(result.success).toBe(false);
  });

  it("should reject task with invalid taskType", () => {
    const invalid = { ...validTask, taskType: "hacking" };
    const result = CandidateTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject task missing required fields", () => {
    const result = CandidateTaskSchema.safeParse({
      id: "task-1",
      title: "Do something",
      // missing description, taskType, etc.
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid tasks array with 8 tasks", () => {
    const tasks = Array.from({ length: 8 }, (_, i) => ({
      ...validTask,
      id: `task-${i + 1}`,
    }));
    const result = CandidateTasksSchema.safeParse({ tasks });
    expect(result.success).toBe(true);
  });
});
