/**
 * Talkdesk API client — server-side only.
 *
 * Auth: OAuth 2.0 client credentials, token cached in module scope,
 * refreshed 60 s before expiry.
 *
 * Set USE_MOCK_DATA=true in .env.local to skip real API calls during dev.
 */

import type { AgentData, AgentSummary, DashboardData } from './types';
import { generateAgentData, generateAgentList, generateMockData } from './mock';

// ── Data-source selection ──────────────────────────────────────────────────────
// Placeholder values shipped in .env.local.example — treated as "not configured".

const CREDENTIAL_PLACEHOLDERS = new Set([
  '', 'youraccountname', 'your_client_id', 'your_client_secret',
]);

function isReal(value: string | undefined): boolean {
  return !!value && !CREDENTIAL_PLACEHOLDERS.has(value);
}

/** True when all three Talkdesk credentials are set to real (non-placeholder) values. */
export function hasRealCredentials(): boolean {
  return (
    isReal(process.env.TALKDESK_ACCOUNT) &&
    isReal(process.env.TALKDESK_CLIENT_ID) &&
    isReal(process.env.TALKDESK_CLIENT_SECRET)
  );
}

/**
 * Whether to serve mock sample data instead of calling Talkdesk.
 *
 * - USE_MOCK_DATA=true forces mock (handy for offline demos).
 * - Otherwise: live data when real credentials are present, mock when they're not.
 *
 * So once real credentials are in .env.local the app uses live data automatically —
 * no need to also flip USE_MOCK_DATA. If a live call then fails, the page surfaces
 * a clear error rather than silently falling back to fake numbers.
 */
export function useMockData(): boolean {
  if (process.env.USE_MOCK_DATA === 'true') return true;
  return !hasRealCredentials();
}

// ── Token cache ───────────────────────────────────────────────────────────────

interface TokenCache {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let _token: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  const BUFFER_MS = 60_000;
  if (_token && _token.expiresAt - BUFFER_MS > Date.now()) {
    return _token.accessToken;
  }

  const account = process.env.TALKDESK_ACCOUNT!;
  const clientId = process.env.TALKDESK_CLIENT_ID!;
  const clientSecret = process.env.TALKDESK_CLIENT_SECRET!;

  if (!account || !clientId || !clientSecret) {
    throw new Error(
      'Missing Talkdesk credentials. Set TALKDESK_ACCOUNT, TALKDESK_CLIENT_ID, ' +
        'and TALKDESK_CLIENT_SECRET in .env.local (or set USE_MOCK_DATA=true).',
    );
  }

  // Talkdesk's "Client Credentials - Basic" flow sends client_id:client_secret as
  // an HTTP Basic auth header, NOT as form-body fields. The body carries only
  // grant_type (+ optional scope). Verified against docs.talkdesk.com/docs/client-credentials.
  // Regional accounts use a different identity host (.eu / .au / talkdeskidca.com).
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await fetch(`https://${account}.talkdeskid.com/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!resp.ok) {
    throw new Error(`Talkdesk OAuth failed (${resp.status}): ${await resp.text()}`);
  }

  const json = await resp.json();
  _token = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return _token.accessToken;
}

// ── Authenticated fetch helper ────────────────────────────────────────────────

async function tdFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`https://api.talkdeskapp.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

function dateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 182 * 86_400_000); // 26 weeks
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

// ── Metric fetchers (real endpoints — TODO once plan confirmed) ───────────────
//
// IMPORTANT — verified against docs.talkdesk.com (2026): all three of these
// metrics now come from the unified **Explore API**, which is ASYNCHRONOUS and
// job-based, not a single synchronous POST. The lifecycle is the same for every
// report type:
//
//   1. POST   /data-reports/{type}/jobs            → returns a report job id
//   2. GET    /data-reports/{type}/jobs/{id}       → poll until the job completes
//   3. GET    /data-reports/{type}/files/{id}      → download the result file
//
// (Base host stays https://api.talkdeskapp.com for US; .eu/.au/ca for other regions.)
//
// Two consequences vs. the old assumptions below:
//   • These reports return GRANULAR / RAW ROWS (per-call, per-adherence-event,
//     per-evaluation), NOT pre-aggregated weekly percentages. We must bucket and
//     average them ourselves into WeeklyDataPoint[].
//   • Each request covers at most ~1 month, so 26 weeks needs several jobs.
//
// A small `runExploreReport(type, body)` helper that does create → poll → download
// would be worth adding before implementing the three functions below.

/**
 * TODO: Call Acceptance Rate — needs the Explore "calls" report.
 *
 *   POST /data-reports/calls/jobs   (then poll + download per the lifecycle above)
 *
 * The calls report returns one row PER CALL (fields like call_id, type, start_at,
 * disposition_code, talk_time…). There is no ready-made answered/abandoned weekly
 * count — derive it: bucket rows by ISO week, count answered vs abandoned from the
 * disposition/status field, then rate = answered / (answered + abandoned) × 100.
 *
 * ⚠️ Verify the exact field/values that distinguish answered vs abandoned in the
 *    "Calls Report metrics" data dictionary — the doc sample didn't name them.
 */
async function fetchCallAcceptance(
  _from: string,
  _to: string,
): Promise<{ weekStart: string; rate: number; volume: number }[]> {
  throw new Error('Reporting API not yet implemented — set USE_MOCK_DATA=true');
}

/**
 * TODO: Schedule Adherence — needs the Explore "adherence" report (WFM module).
 *
 *   POST /data-reports/adherence/jobs   (then poll + download per the lifecycle above)
 *
 * ⚠️ This returns a RAW LOG of adherence events per agent (status "Aligned" /
 *    "Deviated", with durations), NOT an adherence_percentage. Compute it yourself:
 *    adherence = aligned_time / scheduled_time × 100, bucketed by week and averaged
 *    across agents. (Max ~1 month of data per request.)
 */
async function fetchScheduleAdherence(
  _from: string,
  _to: string,
): Promise<{ weekStart: string; rate: number }[]> {
  throw new Error('WFM API not yet implemented — set USE_MOCK_DATA=true');
}

/**
 * TODO: QA Score — needs the Explore "qm_evaluation_analysis" report (QM module).
 *
 *   POST /data-reports/qm_evaluation_analysis/jobs   (poll + download per above)
 *
 * ⚠️ Returns one ROW PER EVALUATION (agent, evaluator, form, score, question-level
 *    detail), NOT an average per week. Aggregate yourself: bucket completed
 *    evaluations by week and average their scores. (Max ~1 month per request.)
 */
async function fetchQaScore(
  _from: string,
  _to: string,
): Promise<{ weekStart: string; score: number }[]> {
  throw new Error('QM API not yet implemented — set USE_MOCK_DATA=true');
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function fetchMetrics(): Promise<DashboardData> {
  if (useMockData()) {
    return generateMockData();
  }

  const { from, to } = dateRange();

  // Fetch all three in parallel to minimize latency.
  const [carRows, saRows, qaRows] = await Promise.all([
    fetchCallAcceptance(from, to),
    fetchScheduleAdherence(from, to),
    fetchQaScore(from, to),
  ]);

  // TODO: Merge carRows / saRows / qaRows by weekStart, build WeeklyDataPoint[],
  // aggregate to MonthlyDataPoint[], compute KpiSummary, and return DashboardData.
  // Until implemented, the stubs above throw, so execution won't reach here.
  void carRows; void saRows; void qaRows;
  throw new Error('Real data merging not yet implemented');
}

// ── Agent list ────────────────────────────────────────────────────────────────

/**
 * TODO: Fetch the agent roster from Talkdesk.
 *
 * Verified against docs.talkdesk.com (2026). Two options:
 *   • Users API:    GET /users                  (scope users:read, per_page ≤ 200)
 *   • Guardian API: GET /guardian/users         (scope guardian-users:read, OData)
 *
 * Corrections vs. the old assumption (GET /users/v2/users?role=agent):
 *   • Path is /users (or /guardian/users) — there is no /users/v2/users.
 *   • No `role=agent` query param. Filter by role with OData on Guardian, e.g.
 *       /guardian/users?filter=role eq 'Agent'&per_page=200
 *   • Each user exposes a single full `name` field — there is NO first_name/last_name.
 *   • The list is paginated and wrapped: Guardian returns `_embedded: [...]` with
 *     page/total/total_pages; iterate pages until you have everyone.
 *
 * Example skeleton (Guardian):
 *   const resp = await tdFetch(`/guardian/users?filter=role eq 'Agent'&per_page=200`);
 *   const { _embedded } = await resp.json();
 *   return _embedded.map((u: any) => ({ id: u.id, name: u.name }));
 *   // NB: id here is the Talkdesk user id, not a URL slug — see the agent-id note below.
 */
export async function fetchAgents(): Promise<AgentSummary[]> {
  if (useMockData()) {
    return generateAgentList();
  }
  throw new Error('Agent roster API not yet implemented — set USE_MOCK_DATA=true');
}

// ── Per-agent metrics ─────────────────────────────────────────────────────────

/**
 * TODO: Fetch metrics for a single agent, filtered by agent ID.
 *
 * All three Talkdesk APIs (Reporting, WFM, QM) accept an agent_id filter.
 * Add `agent_id: agentId` to each request body / query string.
 *
 * Example skeleton (Reporting API):
 *   const resp = await tdFetch('/data/v1/contacts/report', {
 *     method: 'POST',
 *     body: JSON.stringify({
 *       filters: { date_range: { from, to }, agent_id: agentId },
 *       group_by: ['week'],
 *       metrics: ['answered', 'abandoned'],
 *     }),
 *   });
 */
export async function fetchAgentMetrics(agentId: string): Promise<AgentData> {
  if (useMockData()) {
    return generateAgentData(agentId);
  }
  void dateRange();
  throw new Error('Per-agent metrics API not yet implemented — set USE_MOCK_DATA=true');
}
