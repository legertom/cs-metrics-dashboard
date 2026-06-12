'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AgentSummary } from '@/lib/types';

const TARGET = 85;

// ── CSV export ──────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'Agent',
  'Call Acceptance %', 'Call Acceptance Δ (pp)',
  'Schedule Adherence %', 'Schedule Adherence Δ (pp)',
  'QA Score %', 'QA Score Δ (pp)',
  'Avg Call Volume / wk',
  'Status',
];

// Wrap a cell in quotes and escape embedded quotes so commas/quotes/newlines
// in names (e.g. "Ryan O'Brien") survive Excel / Google Sheets import.
function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildCsv(agents: AgentSummary[]): string {
  const rows = agents.map((a) => {
    const s = a.summary;
    return [
      a.name,
      s.callAcceptanceRate.current.toFixed(1), s.callAcceptanceRate.delta.toFixed(1),
      s.scheduleAdherence.current.toFixed(1),  s.scheduleAdherence.delta.toFixed(1),
      s.qaScore.current.toFixed(1),            s.qaScore.delta.toFixed(1),
      a.avgCallVolume,
      isOnTrack(s) ? 'On Track' : 'Needs Attention',
    ].map(csvCell).join(',');
  });
  return [CSV_HEADERS.map(csvCell).join(','), ...rows].join('\r\n');
}

function downloadCsv(agents: AgentSummary[]) {
  const date = new Date().toISOString().split('T')[0];
  // Prepend a UTF-8 BOM so Excel renders the Δ / accented characters correctly.
  const blob = new Blob(['﻿' + buildCsv(agents)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cs-agents-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildClipboardText(agent: AgentSummary): string {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmt  = (k: AgentSummary['summary']['qaScore']) =>
    `${k.current.toFixed(1)}% (${k.delta >= 0 ? '+' : ''}${k.delta.toFixed(1)} pp)`;
  const allOk =
    agent.summary.callAcceptanceRate.current >= 85 &&
    agent.summary.scheduleAdherence.current  >= 85 &&
    agent.summary.qaScore.current            >= 85;
  return [
    `${agent.name} — ${date}`,
    `Call Acceptance:    ${fmt(agent.summary.callAcceptanceRate)}`,
    `Schedule Adherence: ${fmt(agent.summary.scheduleAdherence)}`,
    `QA Score:           ${fmt(agent.summary.qaScore)}`,
    `Avg Call Volume:    ${agent.avgCallVolume}/wk`,
    `Status: ${allOk ? 'On Track' : 'Needs Attention'}`,
  ].join('\n');
}

function CopyButton({ agent }: { agent: AgentSummary }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(buildClipboardText(agent));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-2 py-1 rounded transition-all ${
        copied
          ? 'text-emerald-400 bg-emerald-400/10'
          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
      }`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

type SortKey    = 'name' | 'callAcceptanceRate' | 'scheduleAdherence' | 'qaScore';
type StatusFilter = 'all' | 'on-track' | 'needs-attention';
type MetricFilter = 'all' | 'callAcceptanceRate' | 'scheduleAdherence' | 'qaScore';

function isOnTrack(s: AgentSummary['summary']) {
  return (
    s.callAcceptanceRate.current >= TARGET &&
    s.scheduleAdherence.current  >= TARGET &&
    s.qaScore.current            >= TARGET
  );
}

function Pill({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function badge(value: number) {
  const ok = value >= TARGET;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded ${
        ok ? 'text-emerald-300' : 'text-red-400'
      }`}
    >
      {value.toFixed(1)}%
    </span>
  );
}

function deltaBadge(delta: number) {
  const sign = delta >= 0 ? '↑' : '↓';
  return (
    <span className={`text-[11px] ${delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
      {sign}{Math.abs(delta).toFixed(1)}
    </span>
  );
}

function statusChip(summary: AgentSummary['summary']) {
  const allOk =
    summary.callAcceptanceRate.current >= TARGET &&
    summary.scheduleAdherence.current  >= TARGET &&
    summary.qaScore.current            >= TARGET;
  return allOk ? (
    <span className="text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
      On Track
    </span>
  ) : (
    <span className="text-[11px] font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
      Needs Attention
    </span>
  );
}

const COLS: { key: SortKey; label: string }[] = [
  { key: 'name',               label: 'Agent' },
  { key: 'callAcceptanceRate', label: 'Call Acceptance' },
  { key: 'scheduleAdherence',  label: 'Schedule Adherence' },
  { key: 'qaScore',            label: 'QA Score' },
];

export default function AgentList({ agents }: { agents: AgentSummary[] }) {
  const [sortKey, setSortKey]       = useState<SortKey>('qaScore');
  const [sortAsc, setSortAsc]       = useState(false);
  const [search, setSearch]         = useState('');
  const [statusF, setStatusF]       = useState<StatusFilter>('all');
  const [metricF, setMetricF]       = useState<MetricFilter>('all');

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const filtered = agents
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    .filter((a) => {
      if (statusF === 'on-track')        return isOnTrack(a.summary);
      if (statusF === 'needs-attention') return !isOnTrack(a.summary);
      return true;
    })
    .filter((a) => {
      if (metricF === 'all') return true;
      return a.summary[metricF].current < TARGET;
    });

  const sorted = [...filtered].sort((a, b) => {
    const av = sortKey === 'name' ? a.name : a.summary[sortKey].current;
    const bv = sortKey === 'name' ? b.name : b.summary[sortKey].current;
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortAsc ? cmp : -cmp;
  });

  const anyActive = search !== '' || statusF !== 'all' || metricF !== 'all';

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="text-slate-700 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortAsc ? '↑' : '↓'}</span>;
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="bg-[#111e33] border border-slate-700/50 rounded-xl px-4 py-3 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 transition-colors"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 mr-0.5">Status</span>
          <Pill active={statusF === 'all'}               onClick={() => setStatusF('all')}>All</Pill>
          <Pill active={statusF === 'on-track'}          onClick={() => setStatusF('on-track')}>On Track</Pill>
          <Pill active={statusF === 'needs-attention'}   onClick={() => setStatusF('needs-attention')}>Needs Attention</Pill>
        </div>

        {/* Metric below target */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 mr-0.5">Below target</span>
          <Pill active={metricF === 'all'}                onClick={() => setMetricF('all')}>Any</Pill>
          <Pill active={metricF === 'callAcceptanceRate'} onClick={() => setMetricF('callAcceptanceRate')}>Call Acc.</Pill>
          <Pill active={metricF === 'scheduleAdherence'}  onClick={() => setMetricF('scheduleAdherence')}>Sched. Adh.</Pill>
          <Pill active={metricF === 'qaScore'}            onClick={() => setMetricF('qaScore')}>QA Score</Pill>
        </div>

        {/* Result count + clear + export */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] text-slate-500 tabular-nums">
            {sorted.length} of {agents.length}
          </span>
          {anyActive && (
            <button
              onClick={() => { setSearch(''); setStatusF('all'); setMetricF('all'); }}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => downloadCsv(sorted)}
            disabled={sorted.length === 0}
            title={anyActive ? 'Download the filtered rows as CSV' : 'Download all rows as CSV'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111e33] border border-slate-700/50 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            {COLS.map(({ key, label }) => (
              <th
                key={key}
                onClick={() => toggleSort(key)}
                className="px-5 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:text-slate-200 transition-colors"
              >
                {label}<SortIcon col={key} />
              </th>
            ))}
            <th className="px-5 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">
              Avg Vol / wk
            </th>
            <th className="px-5 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">
              Status
            </th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                No agents match the current filters.
              </td>
            </tr>
          ) : sorted.map((agent, i) => (
            <tr
              key={agent.id}
              className={`border-b border-slate-800/60 hover:bg-white/[0.03] transition-colors ${
                i % 2 === 0 ? '' : 'bg-white/[0.015]'
              }`}
            >
              <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">
                {agent.name}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  {badge(agent.summary.callAcceptanceRate.current)}
                  {deltaBadge(agent.summary.callAcceptanceRate.delta)}
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  {badge(agent.summary.scheduleAdherence.current)}
                  {deltaBadge(agent.summary.scheduleAdherence.delta)}
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  {badge(agent.summary.qaScore.current)}
                  {deltaBadge(agent.summary.qaScore.delta)}
                </div>
              </td>
              <td className="px-5 py-3.5 text-slate-400 tabular-nums">
                {agent.avgCallVolume}
              </td>
              <td className="px-5 py-3.5">{statusChip(agent.summary)}</td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-3">
                  <CopyButton agent={agent} />
                  <Link
                    href={`/agents/${agent.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View →
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
