import { NextResponse } from 'next/server';
import { getMetricsSnapshot } from '@/lib/metricsStore';

export async function GET(): Promise<NextResponse> {
  try {
    const snapshot = await getMetricsSnapshot();
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
