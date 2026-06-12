import { notFound } from 'next/navigation';
import { fetchAgentMetrics } from '@/lib/talkdesk';
import AgentDashboard from '@/components/AgentDashboard';

export const dynamic = 'force-dynamic';

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await fetchAgentMetrics(id);
    return <AgentDashboard initialData={data} />;
  } catch (err) {
    if ((err as Error).message.includes('Unknown agent')) notFound();
    throw err;
  }
}
