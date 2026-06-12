'use client';

import { useState } from 'react';
import type { WeeklyDataPoint } from '@/lib/types';

const TARGET = 85;

function heatColor(v: number): string {
  if (v >= TARGET) return '#22c55e';
  if (v >= TARGET - 15) return '#f59e0b';
  return '#ef4444';
}

const ROWS: {
  key: keyof Pick<WeeklyDataPoint, 'callAcceptanceRate' | 'scheduleAdherence' | 'qaScore'>;
  label: string;
}[] = [
  { key: 'callAcceptanceRate', label: 'Call Acceptance' },
  { key: 'scheduleAdherence',  label: 'Sched. Adherence' },
  { key: 'qaScore',            label: 'QA Score' },
];

export default function PerformancePulse({ weekly }: { weekly: WeeklyDataPoint[] }) {
  const [tip, setTip] = useState<{ row: string; week: string; val: number } | null>(null);

  return (
    <div className="bg-[#111e33] border border-slate-700/50 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Performance Pulse</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">26-week heatmap · target ≥{TARGET}%</p>
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
