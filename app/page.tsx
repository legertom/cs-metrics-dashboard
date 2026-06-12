import { fetchMetrics } from '@/lib/talkdesk';
import Dashboard from '@/components/Dashboard';

// Always fetch fresh data on page load (important once real API is wired up).
export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await fetchMetrics();
  return <Dashboard initialData={data} />;
}
