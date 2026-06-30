# Frontier — Technical Report

## What Frontier Is

Frontier is a full-stack web application that connects to a user's GitHub repositories, analyzes their commit history, codebase, and project state, then recommends the single highest-leverage task to work on next. It uses a 4-stage LLM pipeline inspired by the Self-Guided Self-Play (SGS) paper, augmented with a trained logistic regression model and embeddings-based learning system.

---

## What Was Built

### Core Pipeline (4 Stages)

**Stage 1: Historian** (`src/lib/frontier/historian.ts`)
- Receives: commits (15-50 based on depth), README, open issues, PRs, repo file tree (up to 500 files), branch list, code snapshots of top 6 most-edited files, file activity analysis, TODO/FIXME extraction, and previously completed task titles
- Produces: `ProjectState` — summary, recent trajectory, completed capabilities, active workstreams, missing pieces, blockers, uncertainty, inferred frontier, tech stack, momentum rating
- Temperature: 0.3 (precision-focused)
- Prompt includes instructions to detect architectural patterns from file paths, flag README discrepancies, and note code comments

**Stage 2: Conjecturer** (`src/lib/frontier/conjecturer.ts`)
- Receives: ProjectState, raw commit messages with file paths, code snippets, file activity patterns, TODO/FIXMEs, self-play reward signal (completed/skipped task history), user goal/deadline/notes
- Produces: 8-12 `CandidateTask` objects, each with an `evidenceChain` (2-4 entries citing specific commits, files, README sections, code comments, or gaps)
- Temperature: 0.8 (creative diversity)
- Prompt includes 2 few-shot examples showing ideal evidence chain format
- Self-play signal: sees past tasks the user completed (positive reward) and skipped (negative reward) as few-shot demonstrations

**Stage 3: Guide** (`src/lib/frontier/guide.ts`)
- Receives: ProjectState, candidate tasks, goal/deadline, previous accuracy score, learning context from embeddings similarity search, self-play reward signal
- Produces: `ScoredTask[]` — each task scored on 7 dimensions (0-5 each): trajectoryFit, deadlineRelevance, blockingPower, informationGain, taskClarity, rightSized, momentum. Plus critique and failureMode.
- Temperature: 0.4 (analytical)
- After Guide scoring, if a trained model exists, scores are blended: 70% Guide + 30% model prediction

**Stage 4: Planner** (`src/lib/frontier/planner.ts`)
- Receives: ProjectState, top 5 scored tasks, goal
- Produces: `FrontierRecommendation` — selected task ID, reasoning, goal connection, what a generic planner would suggest instead (and why it's wrong), 30/60/90 minute execution plans, definition of done, risks, missing context, suggested GitHub issue
- Temperature: 0.5 (balanced)

### ML Components

**Embeddings System** (`src/lib/frontier/embeddings.ts`)
- Uses OpenAI `text-embedding-3-small` to embed each task as a 1536-dimensional vector
- Stores embeddings as float32 blobs in SQLite `task_embeddings` table
- Tracks outcomes: recommended → started → completed | skipped
- Cosine similarity search finds similar past tasks before scoring
- `getLearningSignal()` aggregates which task types the user tends to complete vs skip
- `getSelfPlayExamples()` retrieves completed/skipped tasks as few-shot demonstrations for the Conjecturer and Guide

**Trained Scoring Model** (`src/lib/frontier/scoring-model.ts`)
- Architecture: logistic regression, 1545 input dimensions (1536 embedding + 9 features)
- Training: SGD with binary cross-entropy loss + L2 regularization (λ=0.001), 50 epochs
- Labels: completed/started = 1, skipped = 0
- Minimum 5 labeled samples before training activates
- Weights stored as serialized JSON in SQLite `scoring_models` table (per repo)
- Retrains at the start of each analysis run with all accumulated outcome data
- Prediction blended with Guide score: `finalScore = 0.7 * guideScore + 0.3 * modelPrediction * 35`

**Accuracy Scoring** (`src/lib/frontier/accuracy.ts`)
- Primary: LLM-based semantic comparison (gpt-4o-mini) — compares recommended task description against subsequent commit messages and file changes
- Fallback: keyword overlap scoring if LLM call fails
- Runs at the start of each new analysis, scoring the previous run's recommendation against commits made since then
- Score stored in `analysis_runs.accuracy_score` and fed back to the Guide prompt

### Data Sources

**GitHub API** (`src/lib/github.ts`)
- `getUserRepos()` — user's repos sorted by push date
- `getRepoInfo()` — metadata (description, language, stars, forks, topics)
- `getRecentCommits()` — commit messages, authors, dates, files changed (15-50 based on depth)
- `getReadme()` — full README content
- `getOpenIssues()` — up to 20 open issues with labels and body
- `getRecentPullRequests()` — up to 10 PRs (all states) with body
- `getFileContents()` — actual source code of top 6 most-edited files (up to 2000 chars each)
- `getRepoTree()` — full recursive file tree (up to 500 entries)
- `getBranches()` — all branches with default branch identification
- `createGitHubIssue()` — creates issues from recommendations

**File Analysis** (`src/lib/frontier/file-analysis.ts`)
- `analyzeFileActivity()` — groups files by directory, counts edits, identifies hotspots (3+ edits)
- `extractTodos()` — regex extraction of TODO, FIXME, HACK, XXX, TEMP from code snippets

### Frontend

**Pages:**
- `/` — Landing page: pain point examples, timeline comparison (generic vs Frontier), how it works
- `/demo` — Pre-computed analysis of a fictional e-commerce repo, no auth required
- `/dashboard` — Repo picker, weekly dev schedule calendar, frontier task cards, accuracy stats, learning status, model stats
- `/analysis/[id]` — Real-time pipeline progress (SSE streaming), recommendation card with evidence chain, commit timeline with theme categorization, file activity heatmap, project state, candidate task table with expandable scores, task history timeline, feedback/regenerate, progress tracking
- `/paper` — Explanation of SGS theory, reward functions, scaling law, Frontier mapping

**Key UI Features:**
- SSE streaming shows pipeline stages completing in real-time
- Context dialog before analysis (deadline + what it's for, extra context)
- Start/Done buttons on recommended task — outcomes feed back into the learning system
- Feedback & regenerate — add notes and rerun pipeline with context
- Weekly calendar with repo filtering, frontier pick labels, .ics export
- Auto-scroll to recommendation when it loads
- Auto-close GitHub issues when task marked done

### Database (SQLite)

Four tables:
- `analysis_runs` — pipeline inputs/outputs, status, accuracy score, GitHub issue number
- `task_status` — per-task outcome tracking (started/done/skipped)
- `task_embeddings` — 1536-dim vectors + outcomes for similarity search
- `scoring_models` — serialized logistic regression weights per repo
- `webhook_configs` — stored access tokens for webhook-triggered re-analysis

### Infrastructure

- Next.js 16 App Router + TypeScript
- Tailwind CSS + shadcn/ui + motion.dev
- Auth.js v5 with GitHub OAuth (JWT strategy)
- OpenAI GPT-4o for pipeline stages, gpt-4o-mini for accuracy scoring, text-embedding-3-small for embeddings
- better-sqlite3 with WAL mode
- Octokit for GitHub API
- Zod for schema validation with OpenAI strict mode JSON output

---

## What Was NOT Built

- **Slack/Linear/Notion integrations** — mentioned as future extensions, no code exists
- **Multi-repo cross-project analysis** — each repo is analyzed independently
- **Team/collaboration mode** — single-user only
- **PR diff content** — fetches PR metadata but not actual diff content
- **Git blame/authorship analysis** — no per-file author tracking
- **Deployment** — runs locally only, not deployed to any hosting
- **Tests** — no test files exist (no unit, integration, or e2e tests)
- **Rate limit handling** — no auto-retry on 429 errors
- **Offline mode** — no service worker or caching
- **Share/export** — no shareable URLs for analysis results (beyond .ics calendar)
- **Custom scoring weights** — the 7 Guide dimensions are equally weighted, users can't tune them
- **Fine-tuning** — the logistic regression model is trained from scratch each run, but no actual LLM fine-tuning occurs (would require OpenAI fine-tuning API access)

---

## How the SGS Paper Maps to Frontier

### Paper: "Scaling Self-Play with Self-Guidance" (Bailey et al., Stanford 2026)

The paper describes a system where a language model plays three roles:

| SGS Paper | Frontier Implementation | Fidelity |
|-----------|------------------------|----------|
| **Solver** attempts target problems | **User** works on recommended tasks | Analogous — the user is the Solver |
| **Conjecturer** generates synthetic subproblems conditioned on unsolved targets | **Conjecturer** generates candidate tasks conditioned on the inferred project frontier | High — same conditioning approach |
| **Guide** scores synthetic problems for relevance and clarity (R_guide) | **Guide** scores tasks on 7 dimensions + trained model re-ranks | Partial — scoring exists but the Guide doesn't train via RL |
| R_synth = R_solve × R_guide | Final score = 0.7 × Guide score + 0.3 × model prediction | Partial — blending exists but isn't a multiplicative reward |
| R_solve favors intermediate difficulty (not too easy, not impossible) | rightSized scoring (0-5) ensures 30-120 minute tasks | Analogous |
| Conjecturer trained via REINFORCE on R_synth | Conjecturer sees completed/skipped tasks as in-context few-shot demonstrations | Weak — no gradient updates, just prompt conditioning |
| Guide is frozen (not trained) | Guide receives previous accuracy + self-play examples in prompt | Similar — the paper's Guide is also frozen |
| Solver entropy maintained to prevent collapse | Diverse task types (8 categories) prevent category collapse | Analogous |
| 200+ rounds of iterative self-play | Each analysis run is one "round" — system improves with accumulated outcomes | Analogous structure, much lower iteration count |
| Scaling law: sigmoidal solve rate vs compute | Not implemented — no scaling measurement | Not implemented |

### What We Genuinely Use From SGS

1. **The 3-role architecture** — Conjecturer generates, Guide scores, Solver (user) executes. This is directly from SGS.

2. **Conditioning on unsolved problems** — the Conjecturer is conditioned on the "inferred frontier" (what hasn't been done yet), exactly as SGS conditions on unsolved targets.

3. **Guide as quality control** — the Guide's 7-dimension scoring penalizes degenerate tasks (vague, disconnected, wrong-sized), analogous to SGS preventing Conjecturer collapse via R_guide.

4. **Reward signal from outcomes** — completed tasks = positive reward, skipped tasks = negative reward. This maps to R_solve in SGS, though we implement it as in-context learning rather than gradient updates.

5. **The frozen Guide design** — SGS explicitly keeps the Guide frozen. Our Guide is also not trained — it receives hints from past accuracy but its behavior is prompt-determined, not weight-determined.

### Where We Diverge From SGS

1. **No weight updates** — SGS uses REINFORCE to update the Conjecturer's parameters. We use in-context learning (few-shot demonstrations from past outcomes). The model weights never change.

2. **No actual reinforcement learning** — the "reward signal" is text injected into prompts, not a numerical signal used for gradient computation.

3. **The scoring model is separate** — SGS has the Guide as part of the same model family. Our logistic regression model is a separate system trained on embeddings, not the LLM itself.

4. **No scaling analysis** — SGS fits sigmoidal scaling laws to measure asymptotic performance. We don't measure or report scaling properties.

5. **Single-pass per round** — SGS generates multiple solutions per problem per round. We generate one recommendation per analysis.

### Honest Assessment

Frontier uses SGS as **architectural inspiration**, not as a faithful reimplementation. The 3-role structure, frontier conditioning, and quality scoring are genuine applications of SGS ideas. The self-play claim is defensible at the level of "in-context learning self-play" — the system's effective behavior changes based on accumulated user outcomes — but it is not RL self-play in the sense the paper describes.

The trained logistic regression model is real ML — it trains on embeddings + outcomes and produces predictions that affect task ranking. But it's a simple model doing re-ranking, not a language model learning to be a better Conjecturer.

The most honest framing: **Frontier is an SGS-inspired task recommendation system that uses embeddings-based learning and a trained scoring model to improve over time, with a prompt-based approximation of the self-play feedback loop.**
