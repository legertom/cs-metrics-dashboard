import type { DashboardData, KpiSummary, MonthlyDataPoint, WeeklyDataPoint } from './types';

// Deterministic pseudo-random so SSR and client match (no hydration mismatch).
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

export function generateMockData(): DashboardData {
  // Align to the most recent Monday, then go back 26 weeks.
  const now = new Date();
  const dow = now.getDay();
  const msSinceMonday = ((dow === 0 ? 6 : dow - 1) + 25 * 7) * 86_400_000;
  const start = new Date(now.getTime() - msSinceMonday);
  start.setHours(0, 0, 0, 0);

  const weekly: WeeklyDataPoint[] = [];

  for (let i = 0; i < 26; i++) {
    const t = i / 25; // 0 → 1, drives upward trend
    const s = i * 7 + 100; // stable seed per week

    const wStart = new Date(start.getTime() + i * 7 * 86_400_000);

    // Base values trend upward by ~6–8 pp over the 26 weeks
    const carBase = 81 + t * 7;
    const saBase = 79 + t * 8;
    const qaBase = 82 + t * 8;

    // ±4 pp noise
    const noise = (idx: number) => (seeded(s + idx) - 0.5) * 8;

    weekly.push({
      weekStart: wStart.toISOString().split('T')[0],
      weekLabel: weekLabel(wStart),
      callAcceptanceRate: clamp(carBase + noise(1), 64, 98),
      scheduleAdherence: clamp(saBase + noise(2), 62, 97),
      qaScore: clamp(qaBase + noise(3), 66, 99),
      callVolume: Math.round(180 + seeded(s + 4) * 130),
    });
  }

  // Aggregate to monthly
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

  const monthly: MonthlyDataPoint[] = Array.from(buckets.entries()).map(([month, b]) => ({
    month,
    callAcceptanceRate: Math.round(avg(b.car) * 10) / 10,
    scheduleAdherence: Math.round(avg(b.sa) * 10) / 10,
    qaScore: Math.round(avg(b.qa) * 10) / 10,
    callVolume: b.vol.reduce((a, v) => a + v, 0),
  }));

  // KPI: split 26 weeks in half — recent 13 vs prior 13
  const half = 13;
  const recent = weekly.slice(half);
  const prior = weekly.slice(0, half);

  function kpi(
    field: keyof Pick<WeeklyDataPoint, 'callAcceptanceRate' | 'scheduleAdherence' | 'qaScore'>,
  ): KpiSummary {
    const cur = avg(recent.map((w) => w[field]));
    const prv = avg(prior.map((w) => w[field]));
    return {
      current: Math.round(cur * 10) / 10,
      delta: Math.round((cur - prv) * 10) / 10,
    };
  }

  return {
    weekly,
    monthly,
    summary: {
      callAcceptanceRate: kpi('callAcceptanceRate'),
      scheduleAdherence: kpi('scheduleAdherence'),
      qaScore: kpi('qaScore'),
    },
    lastUpdated: new Date().toISOString(),
  };
}
