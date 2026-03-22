'use client';

import type { MetricsSnapshot } from '@/lib/types';

interface MetricsPanelProps {
  metrics: MetricsSnapshot;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function formatEmergencyType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getResponseTimeColor(ms: number): string {
  if (ms < 50) return 'bg-emerald-500';
  if (ms < 200) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500/20 text-emerald-400';
  if (score >= 55) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  const routeEntries = Object.entries(metrics.routes);
  const decisionEntries = Object.entries(metrics.decisionsByType);

  return (
    <div className="rounded-lg bg-gray-900 p-4 shadow-lg">
      <h2 className="mb-4 text-lg font-semibold text-emerald-400">
        System Metrics
      </h2>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Uptime</p>
          <p className="text-xl font-bold text-emerald-400">
            {formatUptime(metrics.uptime)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Total Requests</p>
          <p className="text-xl font-bold text-emerald-400">
            {metrics.totalRequests}
          </p>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Total Errors</p>
          <p className="text-xl font-bold text-emerald-400">
            {metrics.totalErrors}
          </p>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Error Rate</p>
          <p className="text-xl font-bold text-emerald-400">
            {metrics.errorRate}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Response Times
        </h3>
        {routeEntries.length === 0 ? (
          <p className="text-sm text-gray-500">No data yet</p>
        ) : (
          <div className="space-y-2">
            {routeEntries.map(([route, data]) => (
              <div key={route} className="flex items-center gap-3">
                <span className="w-32 flex-shrink-0 truncate text-xs text-gray-400">
                  {route}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full ${getResponseTimeColor(data.avgResponseMs)}`}
                      style={{ width: `${Math.min(100, data.avgResponseMs / 3)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {data.avgResponseMs}ms
                  </span>
                </div>
                <span className="text-xs text-gray-500 w-20 text-right">
                  {data.count} req{data.count !== 1 ? 's' : ''}
                  {data.errors > 0 && (
                    <span className="text-red-400 ml-1">
                      ({data.errors} err)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Decisions by Type
        </h3>
        {decisionEntries.length === 0 ? (
          <p className="text-sm text-gray-500">No data yet</p>
        ) : (
          <div className="space-y-2">
            {decisionEntries.map(([type, data]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {formatEmergencyType(type)}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {data.count} decision{data.count !== 1 ? 's' : ''}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${getScoreColor(data.avgScore)}`}>
                    avg {data.avgScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        Last updated: {new Date(metrics.collectedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
