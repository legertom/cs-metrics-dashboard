import { fetchMetrics, useMockData } from '@/lib/talkdesk';
import Dashboard from '@/components/Dashboard';
import ErrorState from '@/components/ErrorState';

// Always fetch fresh data on page load (important once real API is wired up).
export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const data = await fetchMetrics();
    return <Dashboard initialData={data} isMock={useMockData()} />;
  } catch (err) {
    return <ErrorState message={(err as Error).message} />;
  }
}
