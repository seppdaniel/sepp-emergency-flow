import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rankHospitals, EMERGENCY_WEIGHTS } from '@/lib/decisionEngine';
import { getHospitalSnapshot } from '@/lib/hospitalStore';
import { prisma } from '@/lib/db';
import { recordMetric } from '@/lib/metricsStore';
import type { EmergencyType } from '@/lib/types';

const VALID_EMERGENCY_TYPES = [
  'heart_attack', 'stroke', 'accident', 'breathing_problem', 'severe_bleeding',
] as const;

const decisionSchema = z.object({
  emergencyType: z.enum(VALID_EMERGENCY_TYPES),
  userLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  hospitals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    distance: z.number().min(0).max(500),
    estimatedTime: z.number().min(0).max(999),
    beds: z.number().int().min(0).max(10000),
    occupancy: z.number().min(0).max(1),
    specialties: z.array(z.enum(VALID_EMERGENCY_TYPES)),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })).optional(),
});

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateReasoning(hospitalName: string, emergencyType: EmergencyType, estimatedTime: number, distance: number, beds: number, occupancy: number): string {
  const weights = EMERGENCY_WEIGHTS[emergencyType];
  const maxKey = Object.entries(weights).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  switch (maxKey) {
    case 'time': return `Selected for fastest response time of ${estimatedTime} min, critical for ${emergencyType.replace(/_/g, ' ')} cases.`;
    case 'distance': return `Selected for closest distance of ${distance} km, critical for ${emergencyType.replace(/_/g, ' ')} cases.`;
    case 'beds': return `Selected for ${beds} available beds, ensuring immediate care.`;
    case 'occupancy': return `Selected for low occupancy of ${Math.round(occupancy * 100)}%, maximizing attention speed.`;
    default: return `Selected as best option for ${emergencyType.replace(/_/g, ' ')} based on overall score.`;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const start = Date.now();
  try {
    const body = await request.json() as unknown;
    const parse = decisionSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parse.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { emergencyType, userLocation, hospitals: bodyHospitals } = parse.data;
    let snapshot = bodyHospitals ?? await getHospitalSnapshot();

    if (userLocation) {
      snapshot = snapshot.map((h) => {
        const distance = Math.round(haversineKm(userLocation.lat, userLocation.lng, h.lat, h.lng) * 10) / 10;
        return { ...h, distance, estimatedTime: Math.floor(distance * 2.5) + 5 };
      });
    }

    const ranked = rankHospitals(snapshot, emergencyType as EmergencyType);
    const best = ranked[0];
    const reasoning = generateReasoning(best.name, emergencyType as EmergencyType, best.estimatedTime, best.distance, best.beds, best.occupancy);

    try {
      await prisma.decisionRecord.create({
        data: {
          emergencyType,
          bestHospitalName: best.name,
          bestHospitalScore: best.score,
          reasoning,
        },
      });
    } catch { /* never block response */ }

    await recordMetric('POST /api/decision', Date.now() - start, false, emergencyType, best.score);

    return NextResponse.json({ best, alternatives: ranked.slice(1, 4), reasoning });
  } catch {
    await recordMetric('POST /api/decision', Date.now() - start, true);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
