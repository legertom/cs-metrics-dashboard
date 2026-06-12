'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { AgentData, KpiSummary, MonthlyDataPoint } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import PerformancePulse from '@/components/PerformancePulse';
import SampleDataBanner from '@/components/SampleDataBanner';

function deltaStyle(delta: number) {
  return delta >= 0 ? 'text-emerald-400' : 'text-red-400';
}

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

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

const GRID = { stroke: '#1a2840', strokeDasharray: '3 3' };
const AXIS = {
  tick: { fill: '#475569', fontSize: 11 },
  axisLine: { stroke: '#1a2840' },
  tickLine: false as const,
};

function ChartTip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
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

function Charts({ monthly }: { monthly: MonthlyDataPoint[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#111e33] border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white">Call Acceptance Rate</h3>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Monthly average</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthly} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="month" {...AXIS} />
            <YAxis domain={[50, 100]} tickFormatter={(v) => `${v}%`} {...AXIS} />
            <Tooltip content={<ChartTip />} />
            <Line type="monotone" dataKey="callAcceptanceRate" name="Acceptance Rate"
              stroke="#3b82f6" strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#111e33] border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white">Schedule Adherence</h3>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Monthly average</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="month" {...AXIS} />
            <YAxis domain={[50, 100]} tickFormatter={(v) => `${v}%`} {...AXIS} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="scheduleAdherence" name="Adherence" fill="#6366f1"
              radius={[3, 3, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#111e33] border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white">QA Score &amp; Call Volume</h3>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Monthly · left axis = score, right axis = volume</p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={monthly} margin={{ top: 4, right: 40, bottom: 4, left: 0 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="month" {...AXIS} />
            <YAxis yAxisId="score" domain={[50, 100]} tickFormatter={(v) => `${v}%`} {...AXIS} />
            <YAxis yAxisId="volume" orientation="right" {...AXIS} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }} />
            <Bar yAxisId="volume" dataKey="callVolume" name="Call Volume"
              fill="#0ea5e9" opacity={0.45} radius={[3, 3, 0, 0]} maxBarSize={40} />
            <Line yAxisId="score" type="monotone" dataKey="qaScore" name="QA Score"
              stroke="#f59e0b" strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AgentDashboard({ initialData, isMock }: { initialData: AgentData; isMock: boolean }) {
  const [data, setData] = useState<AgentData>(initialData);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const resp = await fetch(`/api/agents/${data.agent.id}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setData(await resp.json());
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [data.agent.id]);

  return (
    <div className="flex min-h-screen bg-[#0d1526] text-slate-100">
      <Sidebar />
      <main className="ml-[220px] flex-1 p-8 overflow-y-auto">
        {isMock && <SampleDataBanner />}
        {/* Breadcrumb + header */}
        <div className="mb-1">
          <Link href="/agents" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← All Agents
          </Link>
        </div>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">{data.agent.name}</h1>
            <p className="text-slate-500 text-xs mt-1">
              Rolling 26 weeks · updated {fmtTs(data.lastUpdated)}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <KpiCard label="Call Acceptance Rate" kpi={data.summary.callAcceptanceRate} />
          <KpiCard label="Schedule Adherence"   kpi={data.summary.scheduleAdherence} />
          <KpiCard label="QA Score"             kpi={data.summary.qaScore} />
        </div>

        <PerformancePulse weekly={data.weekly} />
        <Charts monthly={data.monthly} />
      </main>
    </div>
  );
}
