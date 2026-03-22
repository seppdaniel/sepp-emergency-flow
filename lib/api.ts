import type { DecisionResult, EmergencyType } from './types';

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
