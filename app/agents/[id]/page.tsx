import { notFound } from 'next/navigation';
import { fetchAgentMetrics, useMockData } from '@/lib/talkdesk';
import AgentDashboard from '@/components/AgentDashboard';
import ErrorState from '@/components/ErrorState';

export const dynamic = 'force-dynamic';

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await fetchAgentMetrics(id);
    return <AgentDashboard initialData={data} isMock={useMockData()} />;
  } catch (err) {
    if ((err as Error).message.includes('Unknown agent')) notFound();
    return <ErrorState message={(err as Error).message} />;
  }
}
