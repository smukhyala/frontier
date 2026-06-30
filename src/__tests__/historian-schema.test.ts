import { describe, it, expect } from "vitest";
import { ProjectStateSchema } from "@/lib/schemas";

describe("Historian schema validation", () => {
  it("should accept valid historian output", () => {
    const valid = {
      summary: "A Next.js project with auth and dashboard.",
      recentTrajectory: ["Added auth flow", "Built dashboard page"],
      completedCapabilities: ["GitHub OAuth", "User profile"],
      activeWorkstreams: ["Evaluation framework"],
      likelyMissingPieces: ["Tests", "Error handling"],
      blockers: [],
      uncertainty: ["Deploy strategy unclear"],
      inferredFrontier: "Auth is done; evaluation framework is the next boundary.",
      techStack: ["Next.js", "TypeScript", "SQLite"],
      momentum: "active",
    };

    const result = ProjectStateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject malformed historian output gracefully", () => {
    const malformed = {
      summary: 123, // should be string
      recentTrajectory: "not an array",
      momentum: "invalid_value",
    };

    const result = ProjectStateSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it("should reject missing required fields", () => {
    const partial = {
      summary: "A project.",
      // missing everything else
    };

    const result = ProjectStateSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });

  it("should reject invalid momentum enum value", () => {
    const invalid = {
      summary: "A project.",
      recentTrajectory: [],
      completedCapabilities: [],
      activeWorkstreams: [],
      likelyMissingPieces: [],
      blockers: [],
      uncertainty: [],
      inferredFrontier: "Frontier.",
      techStack: [],
      momentum: "blazing", // not a valid enum value
    };

    const result = ProjectStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
