import { NextResponse } from 'next/server';
import { getHospitalSnapshot, fluctuateHospitals } from '@/lib/hospitalStore';
import { recordMetric } from '@/lib/metricsStore';

export async function GET(): Promise<NextResponse> {
  const start = Date.now();
  try {
    await fluctuateHospitals();
    const hospitals = await getHospitalSnapshot();
    await recordMetric('GET /api/hospitals', Date.now() - start, false);
    return NextResponse.json(hospitals);
  } catch {
    await recordMetric('GET /api/hospitals', Date.now() - start, true);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
