/**
 * Talkdesk API client — server-side only.
 *
 * Auth: OAuth 2.0 client credentials, token cached in module scope,
 * refreshed 60 s before expiry.
 *
 * Set USE_MOCK_DATA=true in .env.local to skip real API calls during dev.
 */

import type { DashboardData } from './types';
import { generateMockData } from './mock';

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

  const resp = await fetch(`https://${account}.talkdeskid.com/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
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

/**
 * TODO: Implement once your manager confirms the Reporting API is on your plan.
 *
 * Endpoint (verify in Talkdesk API docs):
 *   POST https://api.talkdeskapp.com/data/v1/contacts/report
 *
 * The body should request answered + abandoned counts grouped by ISO week.
 * Call Acceptance Rate = answered / (answered + abandoned) × 100.
 *
 * Example skeleton:
 *   const resp = await tdFetch('/data/v1/contacts/report', {
 *     method: 'POST',
 *     body: JSON.stringify({
 *       filters: { date_range: { from, to } },
 *       group_by: ['week'],
 *       metrics: ['answered', 'abandoned'],
 *     }),
 *   });
 *   const { results } = await resp.json();
 *   return results.map((r: any) => ({
 *     weekStart: r.period_start,
 *     rate: (r.answered / (r.answered + r.abandoned)) * 100,
 *     volume: r.answered + r.abandoned,
 *   }));
 */
async function fetchCallAcceptance(
  _from: string,
  _to: string,
): Promise<{ weekStart: string; rate: number; volume: number }[]> {
  throw new Error('Reporting API not yet implemented — set USE_MOCK_DATA=true');
}

/**
 * TODO: Implement once your manager confirms the WFM module is on your plan.
 *
 * Endpoint (verify in Talkdesk WFM API docs):
 *   GET https://api.talkdeskapp.com/workforce-management/v1/adherence
 *
 * Returns scheduled vs actual on-queue time per agent per interval.
 * Schedule Adherence = actual / scheduled × 100, averaged across agents.
 *
 * Example skeleton:
 *   const resp = await tdFetch(
 *     `/workforce-management/v1/adherence?start_date=${from}&end_date=${to}&group_by=week`,
 *   );
 *   const { results } = await resp.json();
 *   return results.map((r: any) => ({
 *     weekStart: r.week_start,
 *     rate: r.adherence_percentage,
 *   }));
 */
async function fetchScheduleAdherence(
  _from: string,
  _to: string,
): Promise<{ weekStart: string; rate: number }[]> {
  throw new Error('WFM API not yet implemented — set USE_MOCK_DATA=true');
}

/**
 * TODO: Implement once your manager confirms the QM module is on your plan.
 *
 * Endpoint (verify in Talkdesk QM API docs):
 *   GET https://api.talkdeskapp.com/quality-management/v1/evaluations
 *
 * Returns evaluation scores per agent per week.
 * QA Score = average of all completed evaluation scores × 100.
 *
 * Example skeleton:
 *   const resp = await tdFetch(
 *     `/quality-management/v1/evaluations?start_date=${from}&end_date=${to}&group_by=week`,
 *   );
 *   const { results } = await resp.json();
 *   return results.map((r: any) => ({
 *     weekStart: r.week_start,
 *     score: r.average_score,
 *   }));
 */
async function fetchQaScore(
  _from: string,
  _to: string,
): Promise<{ weekStart: string; score: number }[]> {
  throw new Error('QM API not yet implemented — set USE_MOCK_DATA=true');
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function fetchMetrics(): Promise<DashboardData> {
  if (process.env.USE_MOCK_DATA === 'true') {
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
