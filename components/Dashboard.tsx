'use client';

import { useCallback, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardData, KpiSummary, MonthlyDataPoint, WeeklyDataPoint } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const TARGET = 85;

// ── Helpers ───────────────────────────────────────────────────────────────────

function heatColor(v: number): string {
  if (v >= TARGET) return '#22c55e';
  if (v >= TARGET - 15) return '#f59e0b';
  return '#ef4444';
}

function deltaStyle(delta: number) {
  return delta >= 0 ? 'text-emerald-400' : 'text-red-400';
}

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar() {
  const items = ['Dashboard', 'Team Overview', 'Agents', 'Settings'];
  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] bg-[#0a1120] border-r border-slate-800 flex flex-col z-10">
      <div className="px-6 py-5 border-b border-slate-800">
        <p className="text-blue-400 font-bold text-xs tracking-widest uppercase">CS Metrics</p>
        <p className="text-slate-500 text-[11px] mt-0.5">Team Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((label, i) => (
          <div
            key={label}
            className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
              i === 0
                ? 'bg-blue-600/20 text-blue-300 font-medium'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            {label}
          </div>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-700">Powered by Talkdesk</p>
      </div>
    </aside>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, kpi }: { label: string; kpi: KpiSummary }) {
  const sign = kpi.delta >= 0 ? '↑' : '↓';
  return (
    <div className="flex-1 bg-[#111e33] border border-slate-700/50 rounded-xl p-5">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-3">{label}</p>
      <p className="text-3xl font-bold text-white tabular-nums">{kpi.current.toFixed(1)}%</p>
      <p className={`mt-2 text-sm font-medium ${deltaStyle(kpi.delta)}`}>
        {sign} {Math.abs(kpi.delta).toFixed(1)} pp vs prior period
      </p>
    </div>
  );
}

// ── Performance Pulse heatmap ─────────────────────────────────────────────────

const ROWS: { key: keyof Pick<WeeklyDataPoint, 'callAcceptanceRate' | 'scheduleAdherence' | 'qaScore'>; label: string }[] = [
  { key: 'callAcceptanceRate', label: 'Call Acceptance' },
  { key: 'scheduleAdherence', label: 'Sched. Adherence' },
  { key: 'qaScore', label: 'QA Score' },
];

function PerformancePulse({ weekly }: { weekly: WeeklyDataPoint[] }) {
  const [tip, setTip] = useState<{ row: string; week: string; val: number } | null>(null);

  return (
    <div className="bg-[#111e33] border border-slate-700/50 rounded-xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Performance Pulse</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            26-week heatmap · target ≥{TARGET}%
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
          {[
            { color: '#22c55e', label: `≥${TARGET}%` },
            { color: '#f59e0b', label: `${TARGET - 15}–${TARGET - 1}%` },
            { color: '#ef4444', label: `<${TARGET - 15}%` },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] inline-block" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 580 }}>
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-center gap-2 mb-1.5">
              <p className="text-[11px] text-slate-400 w-28 shrink-0 text-right">{row.label}</p>
              <div className="flex gap-[3px] flex-1">
                {weekly.map((w, i) => {
                  const val = w[row.key];
                  return (
                    <div
                      key={i}
                      className="flex-1 h-6 rounded-[2px] cursor-default transition-opacity hover:opacity-80"
                      style={{ background: heatColor(val) + 'b0' }}
                      onMouseEnter={() => setTip({ row: row.label, week: w.weekLabel, val })}
                      onMouseLeave={() => setTip(null)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Week tick labels every 4 weeks */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-28 shrink-0" />
            <div className="flex gap-[3px] flex-1">
              {weekly.map((w, i) => (
                <div key={i} className="flex-1 text-center overflow-hidden">
                  {i % 4 === 0 && (
                    <span className="text-[9px] text-slate-600 whitespace-nowrap">{w.weekLabel}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip readout */}
      <div className="mt-3 h-6">
        {tip ? (
          <span className="text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded px-3 py-1">
            {tip.row} · {tip.week}:{' '}
            <span className="font-semibold text-white">{tip.val.toFixed(1)}%</span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-700">Hover a cell for details</span>
        )}
      </div>
    </div>
  );
}

// ── Shared chart styles ───────────────────────────────────────────────────────

const GRID = { stroke: '#1a2840', strokeDasharray: '3 3' };
const AXIS = {
  tick: { fill: '#475569', fontSize: 11 },
  axisLine: { stroke: '#1a2840' },
  tickLine: false as const,
};

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2840] border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }} className="flex justify-between gap-5">
          <span>{e.name}</span>
          <span className="font-semibold tabular-nums">{Number(e.value).toFixed(1)}</span>
        </p>
      ))}
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────

function Charts({ monthly }: { monthly: MonthlyDataPoint[] }) {
  return (
    <div className="space-y-6">
      {/* Call Acceptance Rate — Line */}
      <div className="bg-[#111e33] border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white">Call Acceptance Rate</h3>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
          Monthly average · answered ÷ (answered + abandoned)
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthly} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="month" {...AXIS} />
            <YAxis domain={[60, 100]} tickFormatter={(v) => `${v}%`} {...AXIS} />
            <Tooltip content={<ChartTip />} />
            <Line
              type="monotone"
              dataKey="callAcceptanceRate"
              name="Acceptance Rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Schedule Adherence — Bar */}
      <div className="bg-[#111e33] border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white">Schedule Adherence</h3>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Monthly average · WFM module</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="month" {...AXIS} />
            <YAxis domain={[60, 100]} tickFormatter={(v) => `${v}%`} {...AXIS} />
            <Tooltip content={<ChartTip />} />
            <Bar
              dataKey="scheduleAdherence"
              name="Adherence"
              fill="#6366f1"
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* QA Score + Call Volume — Combo / dual axis */}
      <div className="bg-[#111e33] border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white">QA Score &amp; Call Volume</h3>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
          Monthly · QM module · left axis = score, right axis = volume
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={monthly} margin={{ top: 4, right: 40, bottom: 4, left: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="month" {...AXIS} />
            <YAxis yAxisId="score" domain={[60, 100]} tickFormatter={(v) => `${v}%`} {...AXIS} />
            <YAxis yAxisId="volume" orientation="right" {...AXIS} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }} />
            <Bar
              yAxisId="volume"
              dataKey="callVolume"
              name="Call Volume"
              fill="#0ea5e9"
              opacity={0.45}
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
            />
            <Line
              yAxisId="score"
              type="monotone"
              dataKey="qaScore"
              name="QA Score"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const resp = await fetch('/api/metrics');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setData(await resp.json());
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0d1526] text-slate-100">
      <Sidebar />

      <main className="ml-[220px] flex-1 p-8 overflow-y-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">Team Performance</h1>
            <p className="text-slate-500 text-xs mt-1">
              Rolling 26 weeks · updated {fmtTs(data.lastUpdated)}
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* KPI summary cards */}
        <div className="flex gap-4 mb-6">
          <KpiCard label="Call Acceptance Rate" kpi={data.summary.callAcceptanceRate} />
          <KpiCard label="Schedule Adherence" kpi={data.summary.scheduleAdherence} />
          <KpiCard label="QA Score" kpi={data.summary.qaScore} />
        </div>

        {/* Performance Pulse heatmap */}
        <PerformancePulse weekly={data.weekly} />

        {/* Charts */}
        <Charts monthly={data.monthly} />
      </main>
    </div>
  );
}
