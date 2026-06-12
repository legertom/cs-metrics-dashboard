import type {
  AgentData,
  AgentSummary,
  DashboardData,
  KpiSummary,
  MonthlyDataPoint,
  WeeklyDataPoint,
} from './types';

// Deterministic pseudo-random — SSR and client produce identical values.
function seeded(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function weekLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function monthKey(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short' });
}

function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ── Agent roster ──────────────────────────────────────────────────────────────
// carBase / saBase / qaBase reflect each agent's typical performance level.
// Spread across three tiers so the list view has meaningful variance.

const AGENT_PROFILES = [
  // High performers
  { id: 'sarah-chen',       name: 'Sarah Chen',       carBase: 91, saBase: 90, qaBase: 92, volBase: 220 },
  { id: 'marcus-thompson',  name: 'Marcus Thompson',  carBase: 90, saBase: 88, qaBase: 91, volBase: 240 },
  { id: 'priya-patel',      name: 'Priya Patel',      carBase: 89, saBase: 91, qaBase: 90, volBase: 210 },
  { id: 'aisha-williams',   name: 'Aisha Williams',   carBase: 92, saBase: 87, qaBase: 93, volBase: 230 },
  { id: 'mei-lin',          name: 'Mei Lin',           carBase: 88, saBase: 89, qaBase: 89, volBase: 200 },
  { id: 'daniel-kim',       name: 'Daniel Kim',        carBase: 90, saBase: 92, qaBase: 88, volBase: 215 },
  { id: 'amara-okafor',     name: 'Amara Okafor',     carBase: 91, saBase: 90, qaBase: 91, volBase: 225 },
  { id: 'yuki-tanaka',      name: 'Yuki Tanaka',      carBase: 89, saBase: 88, qaBase: 92, volBase: 205 },
  // Mid performers
  { id: 'james-rodriguez',  name: 'James Rodriguez',  carBase: 86, saBase: 84, qaBase: 87, volBase: 195 },
  { id: 'tyler-brooks',     name: 'Tyler Brooks',     carBase: 85, saBase: 83, qaBase: 86, volBase: 185 },
  { id: 'sofia-garcia',     name: 'Sofia Garcia',     carBase: 87, saBase: 85, qaBase: 85, volBase: 190 },
  { id: 'noah-johnson',     name: 'Noah Johnson',     carBase: 84, saBase: 86, qaBase: 84, volBase: 200 },
  { id: 'fatima-hassan',    name: 'Fatima Hassan',    carBase: 86, saBase: 84, qaBase: 88, volBase: 195 },
  { id: 'ethan-miller',     name: 'Ethan Miller',     carBase: 83, saBase: 85, qaBase: 85, volBase: 180 },
  { id: 'zoe-taylor',       name: 'Zoe Taylor',       carBase: 87, saBase: 83, qaBase: 86, volBase: 210 },
  { id: 'rafael-santos',    name: 'Rafael Santos',    carBase: 85, saBase: 86, qaBase: 84, volBase: 188 },
  { id: 'connor-walsh',     name: 'Connor Walsh',     carBase: 84, saBase: 82, qaBase: 83, volBase: 192 },
  { id: 'emma-davis',       name: 'Emma Davis',       carBase: 86, saBase: 84, qaBase: 87, volBase: 198 },
  { id: 'leo-martinez',     name: 'Leo Martinez',     carBase: 83, saBase: 85, qaBase: 85, volBase: 182 },
  { id: 'hannah-wilson',    name: 'Hannah Wilson',    carBase: 85, saBase: 83, qaBase: 86, volBase: 194 },
  // Developing — some metrics below the 85% target
  { id: 'kwame-asante',     name: 'Kwame Asante',     carBase: 79, saBase: 76, qaBase: 81, volBase: 170 },
  { id: 'isabella-brown',   name: 'Isabella Brown',   carBase: 77, saBase: 78, qaBase: 79, volBase: 165 },
  { id: 'ryan-obrien',      name: "Ryan O'Brien",     carBase: 81, saBase: 74, qaBase: 78, volBase: 175 },
  { id: 'valentina-cruz',   name: 'Valentina Cruz',   carBase: 78, saBase: 77, qaBase: 80, volBase: 168 },
] as const;

// ── Shared week-spine (same for team and all agents) ─────────────────────────

function weekSpine(): Date[] {
  const now = new Date();
  const dow = now.getDay();
  const msSinceMonday = ((dow === 0 ? 6 : dow - 1) + 25 * 7) * 86_400_000;
  const start = new Date(now.getTime() - msSinceMonday);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 26 }, (_, i) => new Date(start.getTime() + i * 7 * 86_400_000));
}

// ── Weekly → monthly aggregation ─────────────────────────────────────────────

function toMonthly(weekly: WeeklyDataPoint[]): MonthlyDataPoint[] {
  const buckets = new Map<string, { car: number[]; sa: number[]; qa: number[]; vol: number[] }>();
  for (const w of weekly) {
    const key = monthKey(new Date(w.weekStart));
    if (!buckets.has(key)) buckets.set(key, { car: [], sa: [], qa: [], vol: [] });
    const b = buckets.get(key)!;
    b.car.push(w.callAcceptanceRate);
    b.sa.push(w.scheduleAdherence);
    b.qa.push(w.qaScore);
    b.vol.push(w.callVolume);
  }
  return Array.from(buckets.entries()).map(([month, b]) => ({
    month,
    callAcceptanceRate: Math.round(avg(b.car) * 10) / 10,
    scheduleAdherence:  Math.round(avg(b.sa)  * 10) / 10,
    qaScore:            Math.round(avg(b.qa)   * 10) / 10,
    callVolume: b.vol.reduce((a, v) => a + v, 0),
  }));
}

function toSummary(weekly: WeeklyDataPoint[]) {
  const recent = weekly.slice(13);
  const prior  = weekly.slice(0, 13);
  function kpi(f: keyof Pick<WeeklyDataPoint, 'callAcceptanceRate' | 'scheduleAdherence' | 'qaScore'>): KpiSummary {
    const cur = avg(recent.map((w) => w[f]));
    const prv = avg(prior.map((w) => w[f]));
    return { current: Math.round(cur * 10) / 10, delta: Math.round((cur - prv) * 10) / 10 };
  }
  return {
    callAcceptanceRate: kpi('callAcceptanceRate'),
    scheduleAdherence:  kpi('scheduleAdherence'),
    qaScore:            kpi('qaScore'),
  };
}

// ── Team-level data ───────────────────────────────────────────────────────────

export function generateMockData(): DashboardData {
  const weeks = weekSpine();
  const weekly: WeeklyDataPoint[] = weeks.map((wStart, i) => {
    const t = i / 25;
    const s = i * 7 + 100;
    const noise = (idx: number) => (seeded(s + idx) - 0.5) * 8;
    return {
      weekStart:          wStart.toISOString().split('T')[0],
      weekLabel:          weekLabel(wStart),
      callAcceptanceRate: clamp(81 + t * 7 + noise(1), 64, 98),
      scheduleAdherence:  clamp(79 + t * 8 + noise(2), 62, 97),
      qaScore:            clamp(82 + t * 8 + noise(3), 66, 99),
      callVolume:         Math.round(180 + seeded(s + 4) * 130),
    };
  });

  return {
    weekly,
    monthly:     toMonthly(weekly),
    summary:     toSummary(weekly),
    lastUpdated: new Date().toISOString(),
  };
}

// ── Per-agent data ────────────────────────────────────────────────────────────

function agentWeekly(
  profile: (typeof AGENT_PROFILES)[number],
  weeks: Date[],
): WeeklyDataPoint[] {
  // Use a hash of the agent id as the seed offset so each agent is unique.
  const idSeed = profile.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return weeks.map((wStart, i) => {
    const t = i / 25;
    const s = i * 7 + idSeed;
    const noise = (idx: number) => (seeded(s + idx) - 0.5) * 10;
    // Small upward trend per agent (half the team-level trend to keep variation)
    return {
      weekStart:          wStart.toISOString().split('T')[0],
      weekLabel:          weekLabel(wStart),
      callAcceptanceRate: clamp(profile.carBase + t * 3 + noise(1), 55, 100),
      scheduleAdherence:  clamp(profile.saBase  + t * 3 + noise(2), 55, 100),
      qaScore:            clamp(profile.qaBase   + t * 3 + noise(3), 55, 100),
      callVolume:         Math.round(profile.volBase * (0.85 + seeded(s + 4) * 0.3)),
    };
  });
}

export function generateAgentData(agentId: string): AgentData {
  const profile = AGENT_PROFILES.find((a) => a.id === agentId);
  if (!profile) throw new Error(`Unknown agent id: ${agentId}`);

  const weeks  = weekSpine();
  const weekly = agentWeekly(profile, weeks);

  return {
    agent:       { id: profile.id, name: profile.name },
    weekly,
    monthly:     toMonthly(weekly),
    summary:     toSummary(weekly),
    lastUpdated: new Date().toISOString(),
  };
}

export function generateAgentList(): AgentSummary[] {
  const weeks = weekSpine();
  return AGENT_PROFILES.map((profile) => {
    const weekly  = agentWeekly(profile, weeks);
    const recent  = weekly.slice(13);
    return {
      id:            profile.id,
      name:          profile.name,
      summary:       toSummary(weekly),
      avgCallVolume: Math.round(avg(recent.map((w) => w.callVolume))),
    };
  });
}

// Expose roster so pages can resolve id → name without generating all data.
export { AGENT_PROFILES };
