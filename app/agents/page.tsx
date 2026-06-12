import { fetchAgents, useMockData } from '@/lib/talkdesk';
import Sidebar from '@/components/Sidebar';
import AgentList from '@/components/AgentList';
import SampleDataBanner from '@/components/SampleDataBanner';
import ErrorState from '@/components/ErrorState';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  let agents;
  try {
    agents = await fetchAgents();
  } catch (err) {
    return <ErrorState message={(err as Error).message} />;
  }

  const onTrack = agents.filter((a) =>
    a.summary.callAcceptanceRate.current >= 85 &&
    a.summary.scheduleAdherence.current  >= 85 &&
    a.summary.qaScore.current            >= 85,
  ).length;
  const needsAttn = agents.length - onTrack;

  return (
    <div className="flex min-h-screen bg-[#0d1526] text-slate-100">
      <Sidebar />
      <main className="ml-[220px] flex-1 p-8">
        {useMockData() && <SampleDataBanner />}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Agents</h1>
          <p className="text-slate-500 text-xs mt-1">
            {agents.length} agents · {onTrack} on track ·{' '}
            <span className="text-amber-400">{needsAttn} need attention</span>
          </p>
        </div>
        <AgentList agents={agents} />
      </main>
    </div>
  );
}
