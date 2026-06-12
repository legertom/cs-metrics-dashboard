import { NextResponse } from 'next/server';
import { fetchMetrics } from '@/lib/talkdesk';

export async function GET() {
  try {
    const data = await fetchMetrics();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
