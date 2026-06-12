import { NextResponse } from 'next/server';
import { fetchAgents } from '@/lib/talkdesk';

export async function GET() {
  try {
    return NextResponse.json(await fetchAgents());
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
