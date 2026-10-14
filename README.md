# ProjectPilot AI

AI project management with a **conversational replanner**: talk to your project in plain language and watch the Kanban board restructure itself — safely, explainably, and reversibly.

The whole app is built around one hero flow. Everything else is scaffolding for it.

## The hero loop

```
Natural-language command  →  assemble board context  →  LLM (schema-constrained)
  →  validate against the board (safety gate)  →  apply in a transaction + log
  →  board updates, with reasoning + undo
```

Every AI change is a **typed, validated mutation** — never free-form text written into the database. That's what makes it safe (a malformed plan is rejected before it touches state), explainable (each change carries a reason), and reversible (undo reverts a whole batch atomically).

## Stack

- **Next.js 14** (App Router, TypeScript) — one codebase, one deploy
- **Postgres + Prisma** — data layer
- **Google Gemini 2.0 Flash** — structured JSON output for the AI replanner
- **dnd-kit** — Kanban drag-and-drop
- **Tailwind** — styling

## Run it

```bash
npm install
cp .env.example .env        # then fill in the two values (see below)
npm run setup               # prisma db push + seed the demo project
npm run dev                 # http://localhost:3000
```

`.env` needs two values:

**`DATABASE_URL`** — your Postgres connection string.
Get a free database at [neon.tech](https://neon.tech). Create a project, copy the connection string from the dashboard. It looks like:
```
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**`GEMINI_API_KEY`** — your Google AI Studio key.
Get a free key (no billing required) at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). It looks like:
```
GEMINI_API_KEY="AIzaSy..."
```

Sign in with **Enter demo** (no password — demo auth).

### No Postgres handy? Use SQLite in 2 lines

In `prisma/schema.prisma` set `provider = "sqlite"`, and in `.env` set
`DATABASE_URL="file:./dev.db"`. Then `npm run setup`. The schema is written to
work on both engines unchanged.

## The 90-second demo script

1. Open the **Mobile App Launch** project. The board is pre-seeded with an overdue task, a blocked task, and a high-priority item not started — so the risk badge already reads **medium/high**.
2. Drag a card between columns — instant, optimistic.
3. Press **⌘K** and type: *"We're 3 days behind — cut scope and reprioritise."*
4. The AI proposes a plan with a reason on every change. Click **Apply**.
5. Touched cards flash, the board rearranges, the **risk score updates**, and an **Undo** toast appears.
6. Hit **Undo** — the whole batch reverts atomically.

## Project structure

```
app/
  (auth)/login            demo sign-in
  (app)/dashboard         analytics cards + project list
  (app)/projects/[id]     the board (server) → ProjectWorkspace (client)
  api/
    projects, tasks       REST CRUD
    ai/replan             PROPOSE: context → model → validate (no writes)
    ai/apply              COMMIT: re-validate → transactional apply + log
    ai/undo               revert a batch
    ai/risk               deterministic health score
lib/
  ai/
    schemas.ts            Zod plan shape + validateAgainstBoard (safety gate)
    prompt.ts             system + user prompt
    replan.ts             generate + validate + one repair attempt
    apply-mutations.ts    transactional writer + undo, AiAction logging
    board.ts              board snapshot for the model
    risk.ts               non-LLM health scoring
    config.ts             Gemini client + model name
  auth.ts  db.ts  constants.ts  http.ts  api.ts  types.ts
components/
  board/                  Board, Column, TaskCard (dnd-kit)
  command-bar/            ⌘K CommandBar
  ai/                     ReasoningPanel, UndoToast, RiskBadge
  ProjectWorkspace.tsx    owns board state; AI + drag mutate the same source
```

## What's built vs. deliberately deferred

**Built (the critical path):** demo auth, projects + tasks CRUD, Kanban with drag-and-drop, the full replan → validate → apply → undo loop, explainability, deterministic risk scoring, a dashboard, and a seeded demo project.

**Deferred on purpose** (they were cut to keep the hero sharp — each is a small add):
- **Calendar / meetings** — a read-only view over `task.dueDate`.
- **Full analytics suite** — the dashboard has the core cards; add charts with a lib like Recharts.
- **Reports / PDF export** — generate from `AiAction` history.
- **Settings, dark mode, real-time notifications, attachments** — nice-to-haves, not demo-critical.
- **Real auth** — swap demo cookies for JWT in `lib/auth.ts` + the login route.

## Nice upgrades if you have time

- **Stream the plan**: use `generateContentStream` in `replan.ts` so mutations appear as they arrive.
- **Auto-standup**: add `POST /api/ai/standup` that summarises the day's `AiAction` rows.
- **Per-mutation apply**: let users accept/reject individual changes in the ReasoningPanel.
