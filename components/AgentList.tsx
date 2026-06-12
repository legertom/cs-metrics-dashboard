'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AgentSummary } from '@/lib/types';

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

const TARGET = 85;

type SortKey = 'name' | 'callAcceptanceRate' | 'scheduleAdherence' | 'qaScore';

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
  const [sortKey, setSortKey] = useState<SortKey>('qaScore');
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = [...agents].sort((a, b) => {
    const av = sortKey === 'name' ? a.name : a.summary[sortKey].current;
    const bv = sortKey === 'name' ? b.name : b.summary[sortKey].current;
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortAsc ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="text-slate-700 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortAsc ? '↑' : '↓'}</span>;
  }

  return (
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
          {sorted.map((agent, i) => (
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
  );
}
