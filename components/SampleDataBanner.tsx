// Shown whenever the dashboard is displaying mock sample data instead of live
// Talkdesk metrics — so figures are never mistaken for real performance data.

export default function SampleDataBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p className="text-xs text-amber-200/90 leading-relaxed">
        <span className="font-semibold text-amber-200">Sample data</span> — these
        figures are simulated for demonstration, not real team performance. Add your
        Talkdesk credentials in <code className="text-amber-100">.env.local</code> to
        see live metrics.
      </p>
    </div>
  );
}
