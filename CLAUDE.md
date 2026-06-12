# CS Metrics Dashboard

Next.js 15 dashboard displaying Talkdesk call-centre metrics for a ~24-person CS team.

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
| `USE_MOCK_DATA` | Set `true` for sample data, `false` for live Talkdesk data |

`.env.local` is gitignored and will never be committed.

## Mock data vs live data

`USE_MOCK_DATA=true` (default) uses `lib/mock.ts` — deterministic seeded data for 24 agents, no API calls. Safe to use offline or before credentials are available.

`USE_MOCK_DATA=false` calls the real Talkdesk APIs. The three fetch functions are stubbed with detailed TODOs in `lib/talkdesk.ts` — they throw until implemented, which is the expected state until the manager's API credentials and plan modules are confirmed.

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

When the manager has confirmed her Talkdesk plan includes WFM and QM modules and has API credentials, the three async functions in `lib/talkdesk.ts` need to be implemented:

1. `fetchCallAcceptance` — Reporting API, `answered / (answered + abandoned)`
2. `fetchScheduleAdherence` — WFM API, requires WFM module
3. `fetchQaScore` — QM API, requires QM module

Each function has a detailed comment showing the expected endpoint and response shape.
