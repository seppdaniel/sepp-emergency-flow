import type { DecisionResult, EmergencyType, HospitalBase, DecisionRecord, MetricsSnapshot } from './types';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const base = typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000')
    : '';
  const response = await fetch(`${base}${path}`, options);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchDecision(
  emergencyType: EmergencyType,
  userLocation?: { lat: number; lng: number }
): Promise<DecisionResult> {
  return apiFetch<DecisionResult>('/api/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emergencyType, userLocation }),
  });
}

export async function fetchDecisionWithData(
  emergencyType: EmergencyType,
  hospitals: (HospitalBase & { beds: number; occupancy: number })[]
): Promise<DecisionResult> {
  return apiFetch<DecisionResult>('/api/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emergencyType, hospitals }),
  });
}

export async function fetchHospitals(): Promise<(HospitalBase & { beds: number; occupancy: number })[]> {
  return apiFetch<(HospitalBase & { beds: number; occupancy: number })[]>('/api/hospitals');
}

export async function fetchHistory(limit = 10): Promise<DecisionRecord[]> {
  return apiFetch<DecisionRecord[]>(`/api/history?limit=${limit}`);
}

export async function fetchMetrics(): Promise<MetricsSnapshot> {
  return apiFetch<MetricsSnapshot>('/api/metrics');
}
