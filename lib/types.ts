export type EmergencyType =
  | 'heart_attack'
  | 'stroke'
  | 'accident'
  | 'breathing_problem'
  | 'severe_bleeding';

export interface HospitalBase {
  id: string;
  name: string;
  distance: number;
  estimatedTime: number;
  specialties: EmergencyType[];
  lat: number;
  lng: number;
}

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
  lat: number;
  lng: number;
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

export interface DecisionRecord {
  id: number;
  timestamp: string;
  emergencyType: string;
  bestHospitalName: string;
  bestHospitalScore: number;
  reasoning: string;
}
