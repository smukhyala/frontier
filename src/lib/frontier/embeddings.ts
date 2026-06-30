import OpenAI from "openai";
import Database from "better-sqlite3";
import path from "path";
import { nanoid } from "nanoid";

const client = new OpenAI();

// ── Embedding generation ──

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

// ── Cosine similarity ──

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Database operations ──

function getDb(): Database.Database {
  const dbPath = path.join(process.cwd(), "data", "frontier.db");
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_embeddings (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      user_id TEXT NOT NULL,
      task_title TEXT NOT NULL,
      task_description TEXT NOT NULL,
      task_type TEXT NOT NULL,
      embedding BLOB NOT NULL,
      outcome TEXT NOT NULL DEFAULT 'recommended',
      accuracy_score REAL,
      project_context TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_embeddings_repo ON task_embeddings(owner, repo);
    CREATE INDEX IF NOT EXISTS idx_embeddings_outcome ON task_embeddings(outcome);
  `);
  return db;
}

// ── Store a task embedding with its outcome ──

export interface TaskOutcome {
  owner: string;
  repo: string;
  userId: string;
  taskTitle: string;
  taskDescription: string;
  taskType: string;
  outcome: "completed" | "started" | "skipped" | "recommended";
  accuracyScore?: number;
  projectContext?: string;
}

export async function storeTaskEmbedding(task: TaskOutcome): Promise<void> {
  const db = getDb();
  const text = `${task.taskTitle}. ${task.taskDescription}. Type: ${task.taskType}`;
  const embedding = await getEmbedding(text);
  const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);

  db.prepare(
    `INSERT INTO task_embeddings (id, owner, repo, user_id, task_title, task_description, task_type, embedding, outcome, accuracy_score, project_context)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    nanoid(12),
    task.owner,
    task.repo,
    task.userId,
    task.taskTitle,
    task.taskDescription,
    task.taskType,
    embeddingBuffer,
    task.outcome,
    task.accuracyScore ?? null,
    task.projectContext ?? null
  );
}

// ── Update outcome for existing task ──

export function updateTaskOutcome(
  owner: string,
  repo: string,
  taskTitle: string,
  outcome: "completed" | "started" | "skipped",
  accuracyScore?: number
): void {
  const db = getDb();
  db.prepare(
    `UPDATE task_embeddings SET outcome = ?, accuracy_score = COALESCE(?, accuracy_score) WHERE owner = ? AND repo = ? AND task_title = ?`
  ).run(outcome, accuracyScore ?? null, owner, repo, taskTitle);
}

// ── Find similar past tasks and their outcomes ──

export interface SimilarTask {
  taskTitle: string;
  taskType: string;
  outcome: string;
  accuracyScore: number | null;
  similarity: number;
  projectContext: string | null;
}

export async function findSimilarTasks(
  queryText: string,
  owner: string,
  repo: string,
  limit = 5
): Promise<SimilarTask[]> {
  const db = getDb();

  // Get all embeddings for this repo (or globally if not enough)
  let rows = db
    .prepare("SELECT * FROM task_embeddings WHERE owner = ? AND repo = ?")
    .all(owner, repo) as {
      task_title: string;
      task_type: string;
      embedding: Buffer;
      outcome: string;
      accuracy_score: number | null;
      project_context: string | null;
    }[];

  // Fall back to all user's tasks if not enough repo-specific ones
  if (rows.length < 3) {
    rows = db
      .prepare("SELECT * FROM task_embeddings WHERE owner = ?")
      .all(owner) as typeof rows;
  }

  if (rows.length === 0) return [];

  // Embed the query
  const queryEmbedding = await getEmbedding(queryText);

  // Compute similarities
  const scored = rows.map((row) => {
    const storedEmbedding = Array.from(new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.length / 4));
    return {
      taskTitle: row.task_title,
      taskType: row.task_type,
      outcome: row.outcome,
      accuracyScore: row.accuracy_score,
      similarity: cosineSimilarity(queryEmbedding, storedEmbedding),
      projectContext: row.project_context,
    };
  });

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// ── Get learning signal: what types of tasks worked well? ──

export function getLearningSignal(owner: string, repo: string): {
  successfulTypes: string[];
  failedTypes: string[];
  avgAccuracy: number | null;
  totalTasks: number;
  completedTasks: number;
} {
  const db = getDb();

  const rows = db
    .prepare("SELECT task_type, outcome, accuracy_score FROM task_embeddings WHERE owner = ? AND repo = ?")
    .all(owner, repo) as { task_type: string; outcome: string; accuracy_score: number | null }[];

  if (rows.length === 0) {
    return { successfulTypes: [], failedTypes: [], avgAccuracy: null, totalTasks: 0, completedTasks: 0 };
  }

  const typeOutcomes = new Map<string, { completed: number; skipped: number }>();
  let accSum = 0;
  let accCount = 0;
  let completed = 0;

  for (const row of rows) {
    const entry = typeOutcomes.get(row.task_type) ?? { completed: 0, skipped: 0 };
    if (row.outcome === "completed" || row.outcome === "started") {
      entry.completed++;
      completed++;
    } else if (row.outcome === "skipped") {
      entry.skipped++;
    }
    typeOutcomes.set(row.task_type, entry);

    if (row.accuracy_score !== null) {
      accSum += row.accuracy_score;
      accCount++;
    }
  }

  const successfulTypes: string[] = [];
  const failedTypes: string[] = [];

  for (const [type, counts] of typeOutcomes) {
    const total = counts.completed + counts.skipped;
    if (total >= 2) {
      if (counts.completed / total > 0.6) successfulTypes.push(type);
      if (counts.skipped / total > 0.5) failedTypes.push(type);
    }
  }

  return {
    successfulTypes,
    failedTypes,
    avgAccuracy: accCount > 0 ? Math.round((accSum / accCount) * 100) / 100 : null,
    totalTasks: rows.length,
    completedTasks: completed,
  };
}

// ── Get few-shot examples for self-play: tasks with known outcomes ──

export interface SelfPlayExample {
  taskTitle: string;
  taskDescription: string;
  taskType: string;
  outcome: "completed" | "skipped";
  projectContext: string | null;
}

export function getSelfPlayExamples(
  owner: string,
  repo: string,
  limit = 6
): { completed: SelfPlayExample[]; skipped: SelfPlayExample[] } {
  const db = getDb();

  const completedRows = db
    .prepare(
      "SELECT task_title, task_description, task_type, outcome, project_context FROM task_embeddings WHERE owner = ? AND repo = ? AND outcome IN ('completed', 'started') ORDER BY created_at DESC LIMIT ?"
    )
    .all(owner, repo, limit) as { task_title: string; task_description: string; task_type: string; outcome: string; project_context: string | null }[];

  const skippedRows = db
    .prepare(
      "SELECT task_title, task_description, task_type, outcome, project_context FROM task_embeddings WHERE owner = ? AND repo = ? AND outcome = 'skipped' ORDER BY created_at DESC LIMIT ?"
    )
    .all(owner, repo, limit) as typeof completedRows;

  const toExample = (row: typeof completedRows[0]): SelfPlayExample => ({
    taskTitle: row.task_title,
    taskDescription: row.task_description,
    taskType: row.task_type,
    outcome: row.outcome as "completed" | "skipped",
    projectContext: row.project_context,
  });

  return {
    completed: completedRows.map(toExample),
    skipped: skippedRows.map(toExample),
  };
}
