import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const parse = querySchema.safeParse({ limit: searchParams.get('limit') });
    const limit = parse.success ? parse.data.limit : 20;

    const records = await prisma.decisionRecord.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
