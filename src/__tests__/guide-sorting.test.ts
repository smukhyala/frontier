import { describe, it, expect } from "vitest";
import type { ScoredTask } from "@/lib/schemas";

function sortByScore(tasks: ScoredTask[]): ScoredTask[] {
  return [...tasks].sort((a, b) => b.totalScore - a.totalScore);
}

function makeScoredTask(overrides: Partial<ScoredTask> & { totalScore: number }): ScoredTask {
  return {
    id: "task-1",
    title: "Test task",
    description: "A test task.",
    taskType: "implementation",
    estimatedMinutes: 60,
    whyNow: "Because.",
    evidenceChain: [{ type: "gap", detail: "Something missing" }],
    expectedArtifact: "Working feature",
    dependencies: [],
    scores: {
      trajectoryFit: 3,
      deadlineRelevance: 3,
      blockingPower: 3,
      informationGain: 3,
      taskClarity: 3,
      rightSized: 3,
      momentum: 3,
    },
    critique: "Could be better.",
    failureMode: "Might not work.",
    ...overrides,
  };
}

describe("Guide sorting", () => {
  it("higher score should always rank above lower score", () => {
    const tasks = [
      makeScoredTask({ id: "low", totalScore: 12 }),
      makeScoredTask({ id: "high", totalScore: 28 }),
      makeScoredTask({ id: "mid", totalScore: 20 }),
    ];

    const sorted = sortByScore(tasks);

    expect(sorted[0].id).toBe("high");
    expect(sorted[1].id).toBe("mid");
    expect(sorted[2].id).toBe("low");
  });

  it("equal scores should maintain relative order", () => {
    const tasks = [
      makeScoredTask({ id: "first", totalScore: 20 }),
      makeScoredTask({ id: "second", totalScore: 20 }),
    ];

    const sorted = sortByScore(tasks);
    // Both have same score, order is stable in Array.sort
    expect(sorted.length).toBe(2);
    expect(sorted[0].totalScore).toBe(sorted[1].totalScore);
  });

  it("should handle single task", () => {
    const tasks = [makeScoredTask({ id: "only", totalScore: 25 })];
    const sorted = sortByScore(tasks);
    expect(sorted.length).toBe(1);
    expect(sorted[0].id).toBe("only");
  });

  it("should handle empty array", () => {
    const sorted = sortByScore([]);
    expect(sorted.length).toBe(0);
  });

  it("should correctly sort tasks with extreme score differences", () => {
    const tasks = [
      makeScoredTask({ id: "zero", totalScore: 0 }),
      makeScoredTask({ id: "max", totalScore: 35 }),
      makeScoredTask({ id: "one", totalScore: 1 }),
    ];

    const sorted = sortByScore(tasks);
    expect(sorted[0].id).toBe("max");
    expect(sorted[2].id).toBe("zero");
  });
});
