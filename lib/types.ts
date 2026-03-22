export type EmergencyType =
  | 'heart_attack'
  | 'stroke'
  | 'accident'
  | 'breathing_problem'
  | 'severe_bleeding';

export interface Hospital {
  id: string;
  name: string;
  distance: number;
  estimatedTime: number;
  beds: number;
  occupancy: number;
  specialties: EmergencyType[];
  score: number;
  status: 'excellent' | 'good' | 'risk';
}

export interface EmergencyWeights {
  distance: number;
  time: number;
  beds: number;
  occupancy: number;
  specialtyBonus: number;
}

export interface DecisionResult {
  best: Hospital;
  alternatives: Hospital[];
  reasoning: string;
}
