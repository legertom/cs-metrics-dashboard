import Sidebar from '@/components/Sidebar';

// Friendly full-page error shown when live Talkdesk data can't be loaded —
// rendered inside the normal dashboard shell so nav still works and it doesn't
// look like the app crashed.

export default function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen bg-[#0d1526] text-slate-100">
      <Sidebar />
      <main className="ml-[220px] flex-1 p-8">
        <div className="max-w-xl mt-6 bg-[#111e33] border border-red-500/30 rounded-xl p-6">
          <h1 className="text-lg font-semibold text-red-300">Couldn&apos;t load live data</h1>
          <p className="text-sm text-slate-400 mt-2">
            The dashboard tried to fetch live Talkdesk metrics but the request failed.
          </p>
          <pre className="mt-3 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
{message}
          </pre>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            Check the Talkdesk credentials in <code className="text-slate-300">.env.local</code>,
            or set <code className="text-slate-300">USE_MOCK_DATA=true</code> there to show
            sample data instead.
          </p>
        </div>
      </main>
    </div>
  );
}
