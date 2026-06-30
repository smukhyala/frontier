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

    CREATE TABLE IF NOT EXISTS task_status (
      id TEXT PRIMARY KEY,
      analysis_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'recommended',
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_task_status_repo ON task_status(owner, repo, user_id);

    CREATE TABLE IF NOT EXISTS webhook_configs (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      user_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(owner, repo)
    );
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

export function getCompletedRunsForRepo(
  owner: string,
  repo: string,
  userId: string
): AnalysisRunRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM analysis_runs WHERE owner = ? AND repo = ? AND user_id = ? AND status = 'completed' ORDER BY created_at ASC"
    )
    .all(owner, repo, userId) as AnalysisRunRow[];
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

// ── Task Status ──

export interface TaskStatusRow {
  id: string;
  analysis_id: string;
  task_id: string;
  owner: string;
  repo: string;
  user_id: string;
  title: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function upsertTaskStatus(params: {
  analysisId: string;
  taskId: string;
  owner: string;
  repo: string;
  userId: string;
  title: string;
  status: "started" | "done" | "skipped";
}): void {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM task_status WHERE analysis_id = ? AND task_id = ?")
    .get(params.analysisId, params.taskId) as { id: string } | undefined;

  if (existing) {
    const updates =
      params.status === "started"
        ? "status = 'started', started_at = datetime('now')"
        : params.status === "done"
          ? "status = 'done', completed_at = datetime('now')"
          : "status = 'skipped'";
    db.prepare(`UPDATE task_status SET ${updates} WHERE id = ?`).run(existing.id);
  } else {
    const { nanoid } = require("nanoid");
    db.prepare(
      "INSERT INTO task_status (id, analysis_id, task_id, owner, repo, user_id, title, status, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      nanoid(12),
      params.analysisId,
      params.taskId,
      params.owner,
      params.repo,
      params.userId,
      params.title,
      params.status,
      params.status === "started" ? new Date().toISOString() : null,
      params.status === "done" ? new Date().toISOString() : null
    );
  }
}

export function getTaskStatusesForAnalysis(analysisId: string): TaskStatusRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM task_status WHERE analysis_id = ?")
    .all(analysisId) as TaskStatusRow[];
}

export function getCompletedTasksForRepo(
  owner: string,
  repo: string,
  userId: string
): TaskStatusRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM task_status WHERE owner = ? AND repo = ? AND user_id = ? AND status IN ('done', 'started') ORDER BY created_at DESC"
    )
    .all(owner, repo, userId) as TaskStatusRow[];
}

// ── Accuracy ──

export function updateAccuracyScore(id: string, score: number): void {
  const db = getDb();
  // Add column if it doesn't exist (migration-safe)
  try {
    db.exec("ALTER TABLE analysis_runs ADD COLUMN accuracy_score REAL");
  } catch {
    // Column already exists
  }
  db.prepare("UPDATE analysis_runs SET accuracy_score = ? WHERE id = ?").run(score, id);
}

export function getLatestCompletedRun(
  owner: string,
  repo: string,
  userId: string
): AnalysisRunRow | undefined {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM analysis_runs WHERE owner = ? AND repo = ? AND user_id = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT 1"
    )
    .get(owner, repo, userId) as AnalysisRunRow | undefined;
}

// ── Webhook Configs ──

export interface WebhookConfigRow {
  id: string;
  owner: string;
  repo: string;
  user_id: string;
  access_token: string;
  created_at: string;
}

export function upsertWebhookConfig(params: {
  owner: string;
  repo: string;
  userId: string;
  accessToken: string;
}): void {
  const db = getDb();
  const { nanoid } = require("nanoid");
  db.prepare(
    `INSERT INTO webhook_configs (id, owner, repo, user_id, access_token)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(owner, repo) DO UPDATE SET access_token = ?, user_id = ?`
  ).run(
    nanoid(12),
    params.owner,
    params.repo,
    params.userId,
    params.accessToken,
    params.accessToken,
    params.userId
  );
}

export function getWebhookConfig(
  owner: string,
  repo: string
): WebhookConfigRow | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM webhook_configs WHERE owner = ? AND repo = ?")
    .get(owner, repo) as WebhookConfigRow | undefined;
}

export function deleteWebhookConfig(owner: string, repo: string): void {
  const db = getDb();
  db.prepare("DELETE FROM webhook_configs WHERE owner = ? AND repo = ?").run(owner, repo);
}
