import { EmergencyType, Hospital, EmergencyWeights, DecisionResult } from './types';

export const EMERGENCY_WEIGHTS: Record<EmergencyType, EmergencyWeights> = {
  heart_attack: { time: 0.40, distance: 0.30, occupancy: 0.15, beds: 0.10, specialtyBonus: 0.05 },
  stroke: { time: 0.45, distance: 0.30, occupancy: 0.10, beds: 0.10, specialtyBonus: 0.05 },
  accident: { time: 0.35, distance: 0.35, occupancy: 0.15, beds: 0.10, specialtyBonus: 0.05 },
  breathing_problem: { time: 0.40, distance: 0.35, occupancy: 0.15, beds: 0.05, specialtyBonus: 0.05 },
  severe_bleeding: { time: 0.45, distance: 0.35, occupancy: 0.10, beds: 0.05, specialtyBonus: 0.05 },
};

export function calculateHospitalScore(
  hospital: Omit<Hospital, 'score' | 'status'>,
  emergencyType: EmergencyType
): number {
  const timeScore = Math.max(0, 100 - (hospital.estimatedTime / 60) * 100);
  const distanceScore = Math.max(0, 100 - (hospital.distance / 20) * 100);
  const bedsScore = Math.min(100, hospital.beds * 5);
  const occupancyScore = (1 - hospital.occupancy) * 100;
  const specialtyScore = hospital.specialties.includes(emergencyType) ? 100 : 0;

  const weights = EMERGENCY_WEIGHTS[emergencyType];
  const finalScore =
    timeScore * weights.time +
    distanceScore * weights.distance +
    bedsScore * weights.beds +
    occupancyScore * weights.occupancy +
    specialtyScore * weights.specialtyBonus;

  return Math.round(Math.max(0, Math.min(100, finalScore)));
}

export function getHospitalStatus(score: number): Hospital['status'] {
  if (score >= 75) return 'excellent';
  if (score >= 55) return 'good';
  return 'risk';
}

export function generateReasoning(hospital: Hospital, emergencyType: EmergencyType): string {
  const weights = EMERGENCY_WEIGHTS[emergencyType];
  const reasons: string[] = [];

  if (hospital.estimatedTime <= 10) {
    reasons.push(`fastest response time of ${hospital.estimatedTime} min`);
  } else if (hospital.distance <= 5) {
    reasons.push(`closest distance of ${hospital.distance} km`);
  }

  if (hospital.beds >= 15) {
    reasons.push(`${hospital.beds} available beds`);
  }

  if (hospital.occupancy < 0.3) {
    reasons.push(`low occupancy at ${Math.round((1 - hospital.occupancy) * 100)}%`);
  }

  if (hospital.specialties.includes(emergencyType)) {
    reasons.push(`specialized in ${emergencyType.replace('_', ' ')}`);
  }

  const primaryReason = reasons[0] || 'optimal overall conditions';
  return `Selected for ${primaryReason}, critical for ${emergencyType.replace('_', ' ')} cases.`;
}

export function rankHospitals(
  hospitals: Omit<Hospital, 'score' | 'status'>[],
  emergencyType: EmergencyType
): Hospital[] {
  const ranked = hospitals.map((h) => ({
    ...h,
    score: calculateHospitalScore(h, emergencyType),
    status: getHospitalStatus(calculateHospitalScore(h, emergencyType)),
  }));

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.estimatedTime !== b.estimatedTime) return a.estimatedTime - b.estimatedTime;
    return b.beds - a.beds;
  });

  return ranked;
}

const HOSPITAL_NAMES = [
  'General Hospital Central',
  'City Medical Center',
  'Emergency Care Unit',
  'Trauma Hospital',
  'Heart Institute',
];

const HOSPITAL_COORDS = [
  { lat: -25.4284, lng: -49.2733 },
  { lat: -25.4372, lng: -49.2692 },
  { lat: -25.4190, lng: -49.2610 },
  { lat: -25.4501, lng: -49.2801 },
  { lat: -25.4423, lng: -49.2756 },
];

const ALL_SPECIALTIES: EmergencyType[] = [
  'heart_attack',
  'stroke',
  'accident',
  'breathing_problem',
  'severe_bleeding',
];

export function generateMockHospitals(emergencyType: EmergencyType): Hospital[] {
  const hospitals: Omit<Hospital, 'score' | 'status'>[] = HOSPITAL_NAMES.map((name, index) => {
    const distance = Math.random() * 15 + 2;
    const beds = Math.floor(Math.random() * 20) + 5;
    const occupancy = Math.random() * 0.8 + 0.2;

    const numSpecialties = Math.floor(Math.random() * 3) + 1;
    const specialties: EmergencyType[] = [];
    const shuffled = [...ALL_SPECIALTIES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numSpecialties; i++) {
      specialties.push(shuffled[i]);
    }

    return {
      id: `hospital-${index}`,
      name,
      distance: Math.round(distance * 10) / 10,
      estimatedTime: Math.floor(distance * 2.5) + 5,
      beds,
      occupancy,
      specialties,
      lat: HOSPITAL_COORDS[index].lat,
      lng: HOSPITAL_COORDS[index].lng,
    };
  });

  return rankHospitals(hospitals, emergencyType);
}

export function runDecision(emergencyType: EmergencyType): DecisionResult {
  const hospitals = generateMockHospitals(emergencyType);
  return {
    best: hospitals[0],
    alternatives: hospitals.slice(1, 4),
    reasoning: generateReasoning(hospitals[0], emergencyType),
  };
}
