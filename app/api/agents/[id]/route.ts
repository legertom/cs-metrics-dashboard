import { NextResponse } from 'next/server';
import { fetchAgentMetrics } from '@/lib/talkdesk';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await fetchAgentMetrics(id));
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes('Unknown agent') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
