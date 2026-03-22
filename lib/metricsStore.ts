import { prisma } from './db';
import type { MetricsSnapshot } from './types';

export async function recordMetric(
  route: string,
  durationMs: number,
  isError: boolean,
  emergencyType?: string,
  score?: number
): Promise<void> {
  try {
    await prisma.metricRecord.create({
      data: { route, durationMs, isError, emergencyType, score },
    });
  } catch {
    // never block the request
  }
}

export async function getMetricsSnapshot(): Promise<MetricsSnapshot> {
  const records = await prisma.metricRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  const totalRequests = records.length;
  const totalErrors = records.filter((r) => r.isError).length;
  const errorRate = totalRequests > 0
    ? ((totalErrors / totalRequests) * 100).toFixed(2) + '%'
    : '0.00%';

  const routeMap = new Map<string, { count: number; totalMs: number; errors: number }>();
  for (const r of records) {
    const existing = routeMap.get(r.route) ?? { count: 0, totalMs: 0, errors: 0 };
    routeMap.set(r.route, {
      count: existing.count + 1,
      totalMs: existing.totalMs + r.durationMs,
      errors: existing.errors + (r.isError ? 1 : 0),
    });
  }

  const decisionMap = new Map<string, { count: number; totalScore: number }>();
  for (const r of records.filter((r) => r.emergencyType && r.score)) {
    const key = r.emergencyType!;
    const existing = decisionMap.get(key) ?? { count: 0, totalScore: 0 };
    decisionMap.set(key, {
      count: existing.count + 1,
      totalScore: existing.totalScore + (r.score ?? 0),
    });
  }

  return {
    uptime: process.uptime(),
    totalRequests,
    totalErrors,
    errorRate,
    routes: Object.fromEntries(
      [...routeMap.entries()].map(([route, m]) => [
        route,
        { count: m.count, avgResponseMs: Math.round(m.totalMs / m.count), errors: m.errors },
      ])
    ),
    decisionsByType: Object.fromEntries(
      [...decisionMap.entries()].map(([type, m]) => [
        type,
        { count: m.count, avgScore: Math.round(m.totalScore / m.count) },
      ])
    ),
    collectedAt: new Date().toISOString(),
  };
}
