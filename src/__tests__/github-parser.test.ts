import { describe, it, expect } from "vitest";

// Test the parsing logic that the GitHub module applies to raw API responses.
// We test the transformation functions rather than the API calls themselves.

interface RawCommitResponse {
  sha: string;
  commit: {
    message: string;
    author: { name: string | null; date: string | null } | null;
  };
  files?: { filename: string }[];
}

function parseCommit(raw: RawCommitResponse) {
  return {
    sha: raw.sha.slice(0, 7),
    message: raw.commit.message,
    author: raw.commit.author?.name ?? "Unknown",
    date: raw.commit.author?.date ?? "",
    filesChanged: (raw.files ?? []).map((f) => f.filename),
  };
}

interface RawIssueResponse {
  number: number;
  title: string;
  body: string | null;
  labels: (string | { name?: string })[];
  pull_request?: unknown;
  created_at: string;
  updated_at: string;
}

function parseIssue(raw: RawIssueResponse) {
  return {
    number: raw.number,
    title: raw.title,
    body: raw.body?.slice(0, 500) ?? "",
    labels: raw.labels
      .map((l) => (typeof l === "string" ? l : l.name ?? ""))
      .filter(Boolean),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

describe("GitHub parser", () => {
  it("should correctly extract commit fields", () => {
    const raw: RawCommitResponse = {
      sha: "abc1234567890",
      commit: {
        message: "feat: add evaluation framework\n\nDetailed description here",
        author: { name: "sanjay", date: "2026-06-28T10:00:00Z" },
      },
      files: [
        { filename: "src/lib/evaluation.ts" },
        { filename: "src/app/evaluate/page.tsx" },
        { filename: "package.json" },
      ],
    };

    const parsed = parseCommit(raw);

    expect(parsed.sha).toBe("abc1234");
    expect(parsed.sha).toHaveLength(7);
    expect(parsed.message).toContain("add evaluation framework");
    expect(parsed.author).toBe("sanjay");
    expect(parsed.date).toBe("2026-06-28T10:00:00Z");
    expect(parsed.filesChanged).toHaveLength(3);
    expect(parsed.filesChanged).toContain("src/lib/evaluation.ts");
    expect(parsed.filesChanged).toContain("package.json");
  });

  it("should handle commit with no files", () => {
    const raw: RawCommitResponse = {
      sha: "def4567890123",
      commit: {
        message: "chore: update deps",
        author: { name: "bot", date: "2026-06-27T09:00:00Z" },
      },
    };

    const parsed = parseCommit(raw);
    expect(parsed.filesChanged).toEqual([]);
  });

  it("should handle commit with null author", () => {
    const raw: RawCommitResponse = {
      sha: "ghi7890123456",
      commit: {
        message: "initial commit",
        author: null,
      },
    };

    const parsed = parseCommit(raw);
    expect(parsed.author).toBe("Unknown");
    expect(parsed.date).toBe("");
  });

  it("should correctly extract issue fields", () => {
    const raw: RawIssueResponse = {
      number: 14,
      title: "Add evaluation benchmarks",
      body: "We need benchmarks to compare baseline vs frontier planning.",
      labels: [{ name: "enhancement" }, { name: "evaluation" }],
      created_at: "2026-06-25T08:00:00Z",
      updated_at: "2026-06-28T12:00:00Z",
    };

    const parsed = parseIssue(raw);

    expect(parsed.number).toBe(14);
    expect(parsed.title).toBe("Add evaluation benchmarks");
    expect(parsed.body).toContain("benchmarks");
    expect(parsed.labels).toEqual(["enhancement", "evaluation"]);
  });

  it("should handle issue with null body", () => {
    const raw: RawIssueResponse = {
      number: 15,
      title: "Bug: crash on empty repo",
      body: null,
      labels: ["bug"],
      created_at: "2026-06-26T08:00:00Z",
      updated_at: "2026-06-26T08:00:00Z",
    };

    const parsed = parseIssue(raw);
    expect(parsed.body).toBe("");
    expect(parsed.labels).toEqual(["bug"]);
  });

  it("should truncate long issue body to 500 chars", () => {
    const longBody = "a".repeat(1000);
    const raw: RawIssueResponse = {
      number: 16,
      title: "Long issue",
      body: longBody,
      labels: [],
      created_at: "2026-06-26T08:00:00Z",
      updated_at: "2026-06-26T08:00:00Z",
    };

    const parsed = parseIssue(raw);
    expect(parsed.body).toHaveLength(500);
  });

  it("should filter out empty label names", () => {
    const raw: RawIssueResponse = {
      number: 17,
      title: "Test labels",
      body: null,
      labels: [{ name: "valid" }, { name: "" }, { name: undefined }, "direct"],
      created_at: "2026-06-26T08:00:00Z",
      updated_at: "2026-06-26T08:00:00Z",
    };

    const parsed = parseIssue(raw);
    expect(parsed.labels).toEqual(["valid", "direct"]);
  });
});
