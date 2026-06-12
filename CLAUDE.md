# CS Metrics Dashboard

Next.js 15 dashboard displaying Talkdesk call-centre metrics for a ~24-person CS team.

## Working with the owner of this project

The person running this project is **new to Node.js, Next.js, and the Talkdesk API**. Be extra friendly, patient, and helpful:

- **Explain, don't assume.** When you use a term like "server component", "environment variable", "OAuth", or "async", add a short plain-language note on what it means and why it matters here. Avoid unexplained jargon.
- **Spell out the steps.** Give exact commands to copy/paste, say which directory to run them in, and describe what a successful result looks like (and what a common error looks like).
- **Teach as you go.** Briefly explain *why* a change works, so they learn the stack — but keep it concise, not a lecture.
- **Be encouraging and never condescending.** Beginner questions are welcome. If something is genuinely tricky, say so and reassure them it's normal.
- **Flag risky actions clearly** (deleting files, editing `.env.local`, pushing to GitHub, anything that touches live Talkdesk data) and confirm before doing them.
- **Default to doing it for them** when possible (running commands, verifying in the browser) rather than handing over instructions, and report what happened in simple terms.

## Running the app

```bash
npm run dev        # starts on http://localhost:3000 (or next available port)
npm run build      # production build
```

## Environment

Copy `.env.local.example` to `.env.local` and fill in the values before running.

| Variable | Purpose |
|---|---|
| `TALKDESK_ACCOUNT` | Subdomain — the part before `.talkdesk.com` in the login URL |
| `TALKDESK_CLIENT_ID` | OAuth client ID from Talkdesk Admin → Integrations → API Clients |
| `TALKDESK_CLIENT_SECRET` | OAuth client secret (shown once on creation) |
| `USE_MOCK_DATA` | Optional override — set `true` to force sample data even when real credentials are present. Leave `false` for normal use. |

`.env.local` is gitignored and will never be committed.

## Mock data vs live data

The data source is decided by `useMockData()` in `lib/talkdesk.ts`:

- **Real credentials present** (all three Talkdesk vars set to non-placeholder values) → live data. `USE_MOCK_DATA` is ignored; mock data is never shown.
- **No / placeholder credentials** → `lib/mock.ts` deterministic seeded data for 24 agents, no API calls. Safe offline or before credentials are available.
- `USE_MOCK_DATA=true` → force mock regardless of credentials (offline demos).

When mock data is shown, every page renders a **`SampleDataBanner`** so the figures are never mistaken for real metrics.

The three live fetch functions are stubbed with detailed TODOs in `lib/talkdesk.ts` — they throw until implemented. So once real credentials are added, pages will show the **`ErrorState`** ("Couldn't load live data" + the underlying message) until the API code is written — the app does not silently fall back to fake numbers.

## Architecture

```
app/
  page.tsx                   Team dashboard (server component)
  agents/page.tsx            Agent list (server component)
  agents/[id]/page.tsx       Individual agent (server component)
  api/metrics/route.ts       Team data endpoint (for Refresh button)
  api/agents/route.ts        Agent list endpoint
  api/agents/[id]/route.ts   Per-agent data endpoint

lib/
  talkdesk.ts    Auth (OAuth2 client credentials, token cached in module scope)
                 + fetchMetrics / fetchAgents / fetchAgentMetrics
                 → three real API fetch functions have TODO stubs here
  mock.ts        Seeded 26-week fake data for team + 24 individual agents
  types.ts       Shared TypeScript types

components/
  Dashboard.tsx       Team dashboard UI (client)
  AgentList.tsx       Sortable + filterable agent table (client)
  AgentDashboard.tsx  Individual agent UI (client)
  Sidebar.tsx         Shared nav (client, uses usePathname)
  PerformancePulse.tsx  26-week heatmap (client)
```

## Key facts for making changes

- All data fetching is server-side (page.tsx / route.ts files). Client components receive data as props and call `/api/*` routes for refresh.
- The Performance Pulse heatmap target threshold is `TARGET = 85` in `PerformancePulse.tsx`.
- The agent roster (names, IDs, base performance levels) is `AGENT_PROFILES` in `lib/mock.ts`. Adding or renaming agents means updating that array.
- Agent IDs are URL-safe slugs (e.g. `sarah-chen`). They're used in routes and as seeds for mock data.
- The Talkdesk OAuth token is cached in a module-level variable in `lib/talkdesk.ts` — this is intentional (server-side only, reused across requests).
- Charts use Recharts. The combo chart (QA + Volume) uses `ComposedChart` with dual Y-axes.

## What still needs real API work

When the manager has confirmed her Talkdesk plan includes WFM and QM modules and has API credentials, the three async functions in `lib/talkdesk.ts` need to be implemented. Endpoints below were verified against docs.talkdesk.com in 2026.

All three metrics come from the unified **Explore API**, which is asynchronous: `POST /data-reports/{type}/jobs` → poll `GET /data-reports/{type}/jobs/{id}` → download `GET /data-reports/{type}/files/{id}`. Reports return **raw rows** (per-call / per-event / per-evaluation), so the app must bucket and average them into weekly points itself. Each request covers ≤ ~1 month, so 26 weeks needs several jobs. A shared `runExploreReport` helper is the natural first step.

1. `fetchCallAcceptance` — Explore `calls` report; derive `answered / (answered + abandoned)` from per-call disposition rows.
2. `fetchScheduleAdherence` — Explore `adherence` report (WFM module); returns raw Aligned/Deviated events — compute `aligned ÷ scheduled`.
3. `fetchQaScore` — Explore `qm_evaluation_analysis` report (QM module); returns per-evaluation rows — average them per week.

Roster: `fetchAgents` should use `GET /guardian/users` (or `GET /users`); each user has a single `name` field (no first/last), and the list is paginated under `_embedded`. There is no `/users/v2/users` or `role=agent` param.

Each function has a detailed comment with the corrected endpoint, the gotchas, and the items still worth verifying against the data dictionary.
