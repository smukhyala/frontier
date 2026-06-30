# Frontier

> Find the next task from your actual project trajectory.

Frontier is an SGS-inspired project planning tool that connects to your GitHub repositories, analyzes recent work trajectory, and recommends the next highest-leverage task.

**Static planners start from where you want to end. Frontier starts from where your work actually is.**

## How It Works

Frontier runs a 4-stage LLM pipeline inspired by [Self-Guided Self-Play](https://arxiv.org/abs/2604.20209) (Bailey et al., Stanford 2026):

1. **Historian** — Reconstructs project state from git history, README, issues, PRs, and file activity patterns. Identifies the *project frontier*: the boundary between what's done and what comes next.

2. **Conjecturer** — Generates 8-12 candidate tasks that are local continuations of recent work. Each task includes an evidence chain tracing back to specific commits, files, or README sections.

3. **Guide** — Scores each candidate on 7 dimensions (trajectory fit, deadline relevance, blocking power, information gain, task clarity, right-sized, momentum). Filters out vague, disconnected, or oversized suggestions.

4. **Planner** — Selects the best task and produces a concrete 30/60/90 minute execution plan with definition of done, risks, and a ready-to-create GitHub issue.

## Features

- **Evidence-traced suggestions** — every task cites the specific commits, files, or README sections that motivated it
- **File activity analysis** — identifies hotspot files and active areas across commits
- **Progress tracking** — mark tasks as started/done, pipeline avoids re-recommending completed work
- **Accuracy tracking** — measures how well recommendations predicted what you actually worked on
- **Task history timeline** — see how recommendations evolved across multiple analyses
- **Suggested dev schedule** — weekly calendar distributing tasks across your work week
- **Feedback loop** — refine and regenerate with your input
- **GitHub issue creation** — one-click issue from any recommendation
- **Webhook support** — auto-re-analyze on push (when deployed)

## Setup

### 1. GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set:
   - **Application name**: Frontier
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Note your Client ID and Client Secret

### 2. OpenAI API Key

Get an API key from [platform.openai.com](https://platform.openai.com/)

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in:

```env
AUTH_SECRET=<generate with: npx auth secret>
AUTH_GITHUB_ID=<your GitHub OAuth client ID>
AUTH_GITHUB_SECRET=<your GitHub OAuth client secret>
OPENAI_API_KEY=<your OpenAI API key>
NEXTAUTH_URL=http://localhost:3000
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 16** App Router + TypeScript
- **Tailwind CSS** + **shadcn/ui** + **motion.dev**
- **Auth.js v5** with GitHub OAuth
- **OpenAI GPT-4o** for the LLM pipeline
- **better-sqlite3** for local persistence
- **Octokit** for GitHub API
- **Zod** for schema validation

## Project Structure

```
src/
├── app/
│   ├── api/analysis/       # Pipeline API + SSE streaming
│   ├── api/webhooks/       # GitHub webhook receiver
│   ├── dashboard/          # Repo picker + weekly schedule
│   ├── analysis/           # Analysis results page
│   └── paper/              # SGS paper explanation
├── components/
│   ├── analysis/           # Recommendation card, candidate table, commit graph, file heatmap
│   ├── dashboard/          # Week calendar, accuracy stats, context dialog
│   └── landing/            # Hero, pain point, timeline comparison
├── lib/
│   ├── frontier/           # 4-stage pipeline
│   │   ├── historian.ts    # Stage 1: Project state reconstruction
│   │   ├── conjecturer.ts  # Stage 2: Candidate task generation
│   │   ├── guide.ts        # Stage 3: Multi-dimensional scoring
│   │   ├── planner.ts      # Stage 4: Task selection + execution plan
│   │   ├── pipeline.ts     # Orchestrator + SSE events
│   │   ├── file-analysis.ts # File activity computation
│   │   └── accuracy.ts     # Prediction accuracy scoring
│   ├── auth.ts             # Auth.js configuration
│   ├── db.ts               # SQLite (analysis_runs, task_status, webhook_configs)
│   ├── github.ts           # GitHub API client
│   ├── llm.ts              # OpenAI structured output wrapper
│   └── schemas.ts          # Zod schemas for all pipeline stages
└── hooks/                  # SSE stream consumer, clipboard
```

## The Pipeline

### Scoring Dimensions (Guide)

| Dimension | What it measures |
|-----------|-----------------|
| **Trajectory Fit** | Does this naturally follow from recent work? |
| **Deadline Relevance** | Does this help hit the actual deadline? |
| **Blocking Power** | Does this unlock future work? |
| **Information Gain** | Will completing it reveal useful information? |
| **Task Clarity** | Is it concrete and unambiguous? |
| **Right-Sized** | Can it be done in 30-120 minutes? |
| **Momentum** | Is it likely to produce visible progress? |

### Anti-patterns the Guide penalizes:
- Vague tasks ("improve error handling")
- Tasks disconnected from recent commits
- Fake productivity (renaming, trivial formatting)
- Huge roadmap items disguised as tasks
- Tasks that sound impressive but don't unblock anything

### Accuracy Tracking

After each analysis, when you run a new one on the same repo, Frontier compares what it recommended last time to what you actually committed. It scores keyword overlap between the recommended task and your subsequent commits + file changes. This accuracy metric feeds back into the Guide, adjusting scoring priorities when predictions are off.

## Evaluation

Frontier is evaluated against a baseline planner that only receives the user's goal and deadline. Frontier additionally receives the full repository trajectory: git history, README, file activity patterns, issues, PRs, and code snapshots.

The purpose is to investigate whether software development history contains enough signal to recommend a better next task than static planning.

### How It Works

Navigate to `/evaluate` and:

1. **Choose a repository, goal, and deadline**
2. **Press "Run Comparison"** — the system executes both planners independently
3. **Review side-by-side results** — see what each planner recommends, with full execution plans
4. **Read "Why Frontier Differs"** — an LLM-generated explanation of exactly what additional signals Frontier used, referencing specific commits, files, and project state
5. **Vote** — mark which recommendation is better (Baseline / Frontier / Tie)
6. **Evaluate Outcome** — after working on the repo, return and click "Evaluate Outcome" to score both predictions against what actually happened (0-100)

### Evidence View

Every Frontier recommendation shows its evidence chain — the specific commits, files, README sections, and gaps that motivated the task. This is visually prominent on both the analysis page and the evaluation comparison view.

### What Gets Stored

```
planner_comparisons
├── id, repo, goal, deadline
├── baseline_json     — Baseline planner output
├── frontier_json     — Full Frontier pipeline output
├── diff_json         — LLM analysis of why they differ
├── winner            — Human vote (baseline | frontier | tie)
├── baseline_prediction_score  — 0-100, how well baseline predicted actual work
├── frontier_prediction_score  — 0-100, how well frontier predicted actual work
└── created_at
```

### Aggregate Stats

The evaluate page shows aggregate statistics: total comparisons, win rates, and average prediction scores. These accumulate as you run more comparisons across your repositories.

### Tests

Four lightweight reliability tests validate the core pipeline contracts:

```bash
npm test
```

1. **Historian schema** — malformed LLM output is rejected
2. **Conjecturer schema** — missing fields are caught
3. **Guide sorting** — higher scores always rank above lower scores
4. **GitHub parser** — commits, files, and dates are correctly extracted

## Design Philosophy

This project is a research prototype investigating whether project trajectory can outperform static planning. The evaluation framework is the centerpiece — the claim is not "Frontier recommends your next task" but rather "Can project trajectory outperform static planning?"

## License

MIT
