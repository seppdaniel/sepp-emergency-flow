import type { DecisionResult, EmergencyType, HospitalBase, DecisionRecord } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function fetchDecision(emergencyType: EmergencyType): Promise<DecisionResult> {
  const response = await fetch(`${API_URL}/api/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emergencyType }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<DecisionResult>;
}

export async function fetchHospitals(): Promise<(HospitalBase & { beds: number; occupancy: number })[]> {
  const response = await fetch(`${API_URL}/api/hospitals`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json() as Promise<(HospitalBase & { beds: number; occupancy: number })[]>;
}

export async function fetchDecisionWithData(
  emergencyType: EmergencyType,
  hospitals: (HospitalBase & { beds: number; occupancy: number })[]
): Promise<DecisionResult> {
  const response = await fetch(`${API_URL}/api/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emergencyType, hospitals }),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json() as Promise<DecisionResult>;
}

export async function fetchHistory(limit = 10): Promise<DecisionRecord[]> {
  const response = await fetch(`${API_URL}/api/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json() as Promise<DecisionRecord[]>;
}
