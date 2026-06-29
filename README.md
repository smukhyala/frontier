# Frontier

> Find the next task from your actual project trajectory.

Frontier is an SGS-inspired project planning tool that connects to your GitHub repositories, analyzes recent work trajectory, and recommends the next highest-leverage task.

**Static planners start from where you want to end. Frontier starts from where your work actually is.**

## How It Works

Frontier runs a 4-stage LLM pipeline inspired by the [Self-Guided Self-Play (SGS)](https://arxiv.org/abs/2502.14606) paper:

1. **Historian** - Reconstructs your project's current state from git history, README, issues, and PRs. Identifies the *project frontier*: the boundary between what's done and what naturally comes next.

2. **Conjecturer** - Generates 8-12 candidate next tasks that are local continuations of recent work. Analogous to SGS synthetic problem generation—tasks are stepping stones, not roadmap items.

3. **Guide** - Scores each candidate on 7 dimensions (trajectory fit, deadline relevance, blocking power, information gain, task clarity, right-sized, momentum). Analogous to the SGS Guide reward—filters out busy work and surfaces genuinely valuable next steps.

4. **Planner** - Selects the best task and produces a concrete 30/60/90 minute execution plan with definition of done, risks, and a ready-to-create GitHub issue.

## Setup

### 1. GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set:
   - **Application name**: Frontier
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Note your Client ID and Client Secret

### 2. Anthropic API Key

Get an API key from [console.anthropic.com](https://console.anthropic.com/)

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in:

```env
AUTH_SECRET=<generate with: npx auth secret>
AUTH_GITHUB_ID=<your GitHub OAuth client ID>
AUTH_GITHUB_SECRET=<your GitHub OAuth client secret>
ANTHROPIC_API_KEY=<your Anthropic API key>
NEXTAUTH_URL=http://localhost:3000
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS** + **shadcn/ui** for components
- **motion.dev** for animations
- **Auth.js v5** with GitHub OAuth
- **Anthropic Claude** for LLM pipeline
- **better-sqlite3** for local persistence
- **Octokit** for GitHub API
- **Zod** for schema validation

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/analysis/       # Analysis pipeline API
│   ├── repos/              # Repository picker and dashboard
│   └── analysis/           # Analysis results page
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── landing/            # Landing page components
│   ├── analysis/           # Analysis result components
│   ├── dashboard/          # Repo dashboard components
│   └── repos/              # Repository list components
├── lib/
│   ├── frontier/           # 4-stage pipeline
│   │   ├── historian.ts    # Stage 1: Project state reconstruction
│   │   ├── conjecturer.ts  # Stage 2: Candidate task generation
│   │   ├── guide.ts        # Stage 3: Multi-dimensional scoring
│   │   ├── planner.ts      # Stage 4: Task selection + execution plan
│   │   └── pipeline.ts     # Pipeline orchestrator
│   ├── auth.ts             # Auth.js configuration
│   ├── db.ts               # SQLite database
│   ├── github.ts           # GitHub API client
│   ├── llm.ts              # Anthropic client wrapper
│   └── schemas.ts          # Zod schemas
└── hooks/                  # React hooks (SSE, clipboard)
```

## The Pipeline

### Scoring Dimensions (Guide)

Each candidate task is scored 0-5 on:

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
- Vague tasks
- Tasks disconnected from recent commits
- Fake productivity (renaming, trivial formatting)
- Huge roadmap items disguised as tasks
- Tasks that sound impressive but don't unblock anything

## Future Extensions

- **Linear integration** - Create Linear issues from recommendations
- **Notion integration** - Sync task plans to Notion
- **Slack updates** - Daily frontier task notifications
- **Daily recommendations** - Automated daily task suggestions
- **Evaluation framework** - Compare against static planners
- **Learning preferences** - Adapt to user's task preferences over time
- **Team mode** - Multi-user repository analysis
- **Custom scoring weights** - Let users tune the Guide's scoring rubric

## License

MIT
