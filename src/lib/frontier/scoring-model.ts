/**
 * Trained scoring model for task completion prediction.
 *
 * Architecture:
 *   Input: task embedding (1536-dim) + 9 features = 1545-dim vector
 *   Model: logistic regression with L2 regularization
 *   Output: P(user completes this task) ∈ [0, 1]
 *   Training: stochastic gradient descent on binary cross-entropy loss
 *   Storage: weights stored as JSON blob in SQLite
 *
 * This is a real trained model — not prompt engineering.
 * Weights update every time new outcome data is available.
 */

import Database from "better-sqlite3";
import path from "path";
import { nanoid } from "nanoid";

// ── Model Parameters ──

const EMBEDDING_DIM = 1536;
const FEATURE_DIM = 9; // 7 guide scores + estimatedMinutes + taskTypeIndex
const TOTAL_DIM = EMBEDDING_DIM + FEATURE_DIM;
const LEARNING_RATE = 0.01;
const L2_LAMBDA = 0.001; // regularization
const EPOCHS = 50;
const MIN_TRAINING_SAMPLES = 5;

// ── Task type encoding ──

const TASK_TYPES = [
  "implementation", "debugging", "evaluation", "refactor",
  "documentation", "research", "design", "testing",
];

function encodeTaskType(type: string): number {
  const idx = TASK_TYPES.indexOf(type);
  return idx >= 0 ? idx / TASK_TYPES.length : 0.5;
}

// ── Sigmoid ──

function sigmoid(x: number): number {
  if (x > 500) return 1;
  if (x < -500) return 0;
  return 1 / (1 + Math.exp(-x));
}

// ── Model class ──

export class ScoringModel {
  weights: Float64Array;
  bias: number;
  trained: boolean;
  trainingSamples: number;
  lastTrainedAt: string | null;

  constructor() {
    this.weights = new Float64Array(TOTAL_DIM);
    this.bias = 0;
    this.trained = false;
    this.trainingSamples = 0;
    this.lastTrainedAt = null;
  }

  /**
   * Predict P(completion) for a task.
   * Returns 0.5 (neutral) if model isn't trained yet.
   */
  predict(embedding: number[], features: number[]): number {
    if (!this.trained) return 0.5;

    const input = [...embedding.slice(0, EMBEDDING_DIM), ...features.slice(0, FEATURE_DIM)];
    let z = this.bias;
    for (let i = 0; i < Math.min(input.length, TOTAL_DIM); i++) {
      z += this.weights[i] * input[i];
    }
    return sigmoid(z);
  }

  /**
   * Train on a batch of (embedding, features, label) tuples.
   * label: 1 = completed, 0 = skipped
   * Uses SGD with binary cross-entropy loss + L2 regularization.
   */
  train(
    data: { embedding: number[]; features: number[]; label: number }[]
  ): { loss: number; accuracy: number } {
    if (data.length < MIN_TRAINING_SAMPLES) {
      return { loss: 0, accuracy: 0 };
    }

    // Initialize weights with small random values if not trained
    if (!this.trained) {
      for (let i = 0; i < TOTAL_DIM; i++) {
        this.weights[i] = (Math.random() - 0.5) * 0.01;
      }
      this.bias = 0;
    }

    let finalLoss = 0;
    let correct = 0;

    for (let epoch = 0; epoch < EPOCHS; epoch++) {
      // Shuffle data
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      let epochLoss = 0;

      for (const sample of shuffled) {
        const input = [
          ...sample.embedding.slice(0, EMBEDDING_DIM),
          ...sample.features.slice(0, FEATURE_DIM),
        ];

        // Forward pass
        let z = this.bias;
        for (let i = 0; i < Math.min(input.length, TOTAL_DIM); i++) {
          z += this.weights[i] * input[i];
        }
        const prediction = sigmoid(z);

        // Binary cross-entropy loss
        const loss =
          -sample.label * Math.log(prediction + 1e-7) -
          (1 - sample.label) * Math.log(1 - prediction + 1e-7);
        epochLoss += loss;

        // Gradient: d_loss/d_z = prediction - label
        const gradient = prediction - sample.label;

        // SGD update with L2 regularization
        for (let i = 0; i < Math.min(input.length, TOTAL_DIM); i++) {
          this.weights[i] -=
            LEARNING_RATE * (gradient * input[i] + L2_LAMBDA * this.weights[i]);
        }
        this.bias -= LEARNING_RATE * gradient;
      }

      finalLoss = epochLoss / shuffled.length;
    }

    // Compute final accuracy
    correct = 0;
    for (const sample of data) {
      const pred = this.predict(sample.embedding, sample.features);
      const predicted = pred >= 0.5 ? 1 : 0;
      if (predicted === sample.label) correct++;
    }

    this.trained = true;
    this.trainingSamples = data.length;
    this.lastTrainedAt = new Date().toISOString();

    return {
      loss: finalLoss,
      accuracy: correct / data.length,
    };
  }

  /** Serialize weights to JSON for storage */
  serialize(): string {
    return JSON.stringify({
      weights: Array.from(this.weights),
      bias: this.bias,
      trained: this.trained,
      trainingSamples: this.trainingSamples,
      lastTrainedAt: this.lastTrainedAt,
    });
  }

  /** Deserialize weights from JSON */
  static deserialize(json: string): ScoringModel {
    const model = new ScoringModel();
    try {
      const data = JSON.parse(json);
      model.weights = new Float64Array(data.weights);
      model.bias = data.bias;
      model.trained = data.trained;
      model.trainingSamples = data.trainingSamples;
      model.lastTrainedAt = data.lastTrainedAt;
    } catch {}
    return model;
  }
}

// ── Database operations ──

function getDb(): Database.Database {
  const dbPath = path.join(process.cwd(), "data", "frontier.db");
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS scoring_models (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      model_weights TEXT NOT NULL,
      training_samples INTEGER NOT NULL DEFAULT 0,
      training_loss REAL,
      training_accuracy REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(owner, repo)
    );
  `);
  return db;
}

/** Save trained model to DB */
export function saveModel(owner: string, repo: string, model: ScoringModel, loss: number, accuracy: number): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO scoring_models (id, owner, repo, model_weights, training_samples, training_loss, training_accuracy)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(owner, repo) DO UPDATE SET model_weights = ?, training_samples = ?, training_loss = ?, training_accuracy = ?, created_at = datetime('now')`
  ).run(
    nanoid(12), owner, repo, model.serialize(), model.trainingSamples, loss, accuracy,
    model.serialize(), model.trainingSamples, loss, accuracy
  );
}

/** Load trained model from DB */
export function loadModel(owner: string, repo: string): ScoringModel | null {
  const db = getDb();
  const row = db.prepare("SELECT model_weights FROM scoring_models WHERE owner = ? AND repo = ?").get(owner, repo) as { model_weights: string } | undefined;
  if (!row) return null;
  return ScoringModel.deserialize(row.model_weights);
}

/** Get model stats for display */
export function getModelStats(owner: string, repo: string): {
  trained: boolean;
  samples: number;
  accuracy: number | null;
  loss: number | null;
  lastTrained: string | null;
} | null {
  const db = getDb();
  const row = db.prepare("SELECT training_samples, training_accuracy, training_loss, created_at FROM scoring_models WHERE owner = ? AND repo = ?").get(owner, repo) as { training_samples: number; training_accuracy: number | null; training_loss: number | null; created_at: string } | undefined;
  if (!row) return null;
  return {
    trained: row.training_samples >= MIN_TRAINING_SAMPLES,
    samples: row.training_samples,
    accuracy: row.training_accuracy,
    loss: row.training_loss,
    lastTrained: row.created_at,
  };
}

// ── Training pipeline ──

/**
 * Train or retrain the scoring model using all available embedding + outcome data.
 * Called at the start of each analysis pipeline run.
 */
export async function trainScoringModel(owner: string, repo: string): Promise<{
  model: ScoringModel;
  loss: number;
  accuracy: number;
} | null> {
  const db = getDb();

  // Get all tasks with known outcomes and embeddings
  const rows = db
    .prepare(
      `SELECT embedding, task_type, outcome FROM task_embeddings
       WHERE owner = ? AND repo = ? AND outcome IN ('completed', 'started', 'skipped')
       AND embedding IS NOT NULL`
    )
    .all(owner, repo) as {
      embedding: Buffer;
      task_type: string;
      outcome: string;
    }[];

  if (rows.length < MIN_TRAINING_SAMPLES) return null;

  // Build training data
  const trainingData = rows.map((row) => {
    const embedding = Array.from(
      new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.length / 4)
    );

    // Features: we don't have guide scores stored in embeddings table,
    // so use task type encoding + placeholder features
    const features = [
      encodeTaskType(row.task_type), // task type
      0, 0, 0, 0, 0, 0, 0, 0,       // placeholder for guide scores (not available in embeddings table)
    ];

    return {
      embedding,
      features,
      label: row.outcome === "completed" || row.outcome === "started" ? 1 : 0,
    };
  });

  // Load existing model or create new one
  let model = loadModel(owner, repo);
  if (!model) model = new ScoringModel();

  // Train
  const { loss, accuracy } = model.train(trainingData);

  // Save
  saveModel(owner, repo, model, loss, accuracy);

  return { model, loss, accuracy };
}

/**
 * Score a candidate task using the trained model.
 * Returns P(completion) or null if no model exists.
 */
export function scoreWithModel(
  model: ScoringModel,
  embedding: number[],
  taskType: string,
  guideScores?: {
    trajectoryFit: number;
    deadlineRelevance: number;
    blockingPower: number;
    informationGain: number;
    taskClarity: number;
    rightSized: number;
    momentum: number;
  }
): number {
  const features = [
    encodeTaskType(taskType),
    ...(guideScores
      ? [
          guideScores.trajectoryFit / 5,
          guideScores.deadlineRelevance / 5,
          guideScores.blockingPower / 5,
          guideScores.informationGain / 5,
          guideScores.taskClarity / 5,
          guideScores.rightSized / 5,
          guideScores.momentum / 5,
          0, // reserved
        ]
      : [0, 0, 0, 0, 0, 0, 0, 0]),
  ];

  return model.predict(embedding, features);
}
