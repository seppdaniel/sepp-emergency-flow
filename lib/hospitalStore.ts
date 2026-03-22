import { prisma } from './db';
import type { HospitalBase, EmergencyType } from './types';

const HOSPITAL_BASES: HospitalBase[] = [
  { id: 'hospital-0', name: 'General Hospital Central', distance: 3.1, estimatedTime: 13, specialties: ['heart_attack', 'stroke'] as EmergencyType[], lat: -25.4284, lng: -49.2733 },
  { id: 'hospital-1', name: 'City Medical Center',      distance: 3.8, estimatedTime: 15, specialties: ['accident', 'breathing_problem'] as EmergencyType[], lat: -25.4372, lng: -49.2692 },
  { id: 'hospital-2', name: 'Emergency Care Unit',      distance: 4.2, estimatedTime: 17, specialties: ['severe_bleeding', 'accident'] as EmergencyType[], lat: -25.4190, lng: -49.2610 },
  { id: 'hospital-3', name: 'Trauma Hospital',          distance: 4.7, estimatedTime: 19, specialties: ['heart_attack', 'stroke', 'accident'] as EmergencyType[], lat: -25.4501, lng: -49.2801 },
  { id: 'hospital-4', name: 'Heart Institute',          distance: 5.2, estimatedTime: 21, specialties: ['heart_attack', 'severe_bleeding'] as EmergencyType[], lat: -25.4423, lng: -49.2756 },
];

const DEFAULT_STATES = [
  { id: 'hospital-0', beds: 18, occupancy: 0.35 },
  { id: 'hospital-1', beds: 12, occupancy: 0.55 },
  { id: 'hospital-2', beds: 8,  occupancy: 0.30 },
  { id: 'hospital-3', beds: 22, occupancy: 0.65 },
  { id: 'hospital-4', beds: 6,  occupancy: 0.25 },
];

export async function getHospitalSnapshot(): Promise<(HospitalBase & { beds: number; occupancy: number })[]> {
  const states = await prisma.hospitalState.findMany();

  if (states.length === 0) {
    await prisma.hospitalState.createMany({ data: DEFAULT_STATES });
    return HOSPITAL_BASES.map((base, i) => ({ ...base, ...DEFAULT_STATES[i] }));
  }

  return HOSPITAL_BASES.map((base) => {
    const state = states.find((s) => s.id === base.id);
    return {
      ...base,
      beds: state?.beds ?? 10,
      occupancy: state?.occupancy ?? 0.5,
    };
  });
}

export async function fluctuateHospitals(): Promise<void> {
  const states = await prisma.hospitalState.findMany();
  if (states.length === 0) return;

  for (const state of states) {
    const bedsDelta = Math.floor(Math.random() * 7) - 3;
    const occupancyDelta = (Math.random() * 0.1) - 0.05;

    await prisma.hospitalState.update({
      where: { id: state.id },
      data: {
        beds: Math.min(30, Math.max(1, state.beds + bedsDelta)),
        occupancy: Math.round(
          Math.min(1.0, Math.max(0.1, state.occupancy + occupancyDelta)) * 10000
        ) / 10000,
      },
    });
  }
}
