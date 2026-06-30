import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "data", "frontier.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_runs (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      goal TEXT,
      deadline TEXT,
      notes TEXT,
      depth TEXT DEFAULT 'standard',
      status TEXT NOT NULL DEFAULT 'pending',
      current_stage TEXT,
      historian_output TEXT,
      conjecturer_output TEXT,
      guide_output TEXT,
      planner_output TEXT,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      user_id TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_runs_repo ON analysis_runs(owner, repo);
    CREATE INDEX IF NOT EXISTS idx_runs_user ON analysis_runs(user_id);
  `);

  return db;
}

export interface AnalysisRunRow {
  id: string;
  owner: string;
  repo: string;
  goal: string | null;
  deadline: string | null;
  notes: string | null;
  depth: string;
  status: string;
  current_stage: string | null;
  historian_output: string | null;
  conjecturer_output: string | null;
  guide_output: string | null;
  planner_output: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  user_id: string;
}

export function insertRun(run: {
  id: string;
  owner: string;
  repo: string;
  goal?: string;
  deadline?: string;
  notes?: string;
  depth?: string;
  userId: string;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO analysis_runs (id, owner, repo, goal, deadline, notes, depth, status, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    run.id,
    run.owner,
    run.repo,
    run.goal ?? null,
    run.deadline ?? null,
    run.notes ?? null,
    run.depth ?? "standard",
    run.userId
  );
}

export function updateRunStage(
  id: string,
  stage: string,
  stageOutput: string
): void {
  const db = getDb();
  const column = `${stage}_output`;
  const validColumns = [
    "historian_output",
    "conjecturer_output",
    "guide_output",
    "planner_output",
  ];
  if (!validColumns.includes(column)) {
    throw new Error(`Invalid stage: ${stage}`);
  }
  db.prepare(
    `UPDATE analysis_runs SET current_stage = ?, ${column} = ?, status = 'running' WHERE id = ?`
  ).run(stage, stageOutput, id);
}

export function updateRunStatus(
  id: string,
  status: "completed" | "failed",
  error?: string
): void {
  const db = getDb();
  if (status === "completed") {
    db.prepare(
      `UPDATE analysis_runs SET status = 'completed', completed_at = datetime('now') WHERE id = ?`
    ).run(id);
  } else {
    db.prepare(
      `UPDATE analysis_runs SET status = 'failed', error = ?, completed_at = datetime('now') WHERE id = ?`
    ).run(error ?? "Unknown error", id);
  }
}

export function getRun(id: string): AnalysisRunRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM analysis_runs WHERE id = ?").get(id) as
    | AnalysisRunRow
    | undefined;
}

export function getRunsByRepo(
  owner: string,
  repo: string,
  userId: string,
  limit = 10
): AnalysisRunRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM analysis_runs WHERE owner = ? AND repo = ? AND user_id = ? ORDER BY created_at DESC LIMIT ?"
    )
    .all(owner, repo, userId, limit) as AnalysisRunRow[];
}

export function getRecentCompletedRuns(
  userId: string,
  limit = 5
): AnalysisRunRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM analysis_runs WHERE user_id = ? AND status = 'completed' AND planner_output IS NOT NULL ORDER BY completed_at DESC LIMIT ?"
    )
    .all(userId, limit) as AnalysisRunRow[];
}
