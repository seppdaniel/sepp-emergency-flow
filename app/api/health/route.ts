import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
