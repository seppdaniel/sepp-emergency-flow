import { HospitalBase } from '../../lib/types';

export const HOSPITAL_BASES: HospitalBase[] = [
  {
    id: 'hospital-0',
    name: 'General Hospital Central',
    distance: 8.4,
    estimatedTime: 25,
    specialties: ['heart_attack', 'stroke'],
    lat: -25.4284,
    lng: -49.2733,
  },
  {
    id: 'hospital-1',
    name: 'City Medical Center',
    distance: 5.1,
    estimatedTime: 18,
    specialties: ['accident', 'breathing_problem'],
    lat: -25.4372,
    lng: -49.2692,
  },
  {
    id: 'hospital-2',
    name: 'Emergency Care Unit',
    distance: 12.0,
    estimatedTime: 34,
    specialties: ['stroke'],
    lat: -25.4190,
    lng: -49.2610,
  },
  {
    id: 'hospital-3',
    name: 'Trauma Hospital',
    distance: 4.7,
    estimatedTime: 16,
    specialties: ['heart_attack', 'stroke', 'accident'],
    lat: -25.4501,
    lng: -49.2801,
  },
  {
    id: 'hospital-4',
    name: 'Heart Institute',
    distance: 2.9,
    estimatedTime: 12,
    specialties: ['heart_attack', 'severe_bleeding'],
    lat: -25.4423,
    lng: -49.2756,
  },
];

interface HospitalState {
  beds: number;
  occupancy: number;
}

const hospitalStates = new Map<string, HospitalState>();

let simulatorStarted = false;

function initializeStates(): void {
  HOSPITAL_BASES.forEach((hospital) => {
    hospitalStates.set(hospital.id, {
      beds: Math.floor(Math.random() * 20) + 5,
      occupancy: Math.random() * 0.7 + 0.2,
    });
  });
}

export function getHospitalSnapshot(): (HospitalBase & HospitalState)[] {
  return HOSPITAL_BASES.map((base) => {
    const state = hospitalStates.get(base.id) || { beds: 5, occupancy: 0.5 };
    return {
      ...base,
      beds: state.beds,
      occupancy: state.occupancy,
    };
  });
}

export function startSimulator(): void {
  if (simulatorStarted) return;
  simulatorStarted = true;

  initializeStates();

  setInterval(() => {
    hospitalStates.forEach((state, id) => {
      const bedsDelta = Math.floor(Math.random() * 7) - 3;
      const occupancyDelta = Math.random() * 0.1 - 0.05;

      const newBeds = Math.max(1, Math.min(30, state.beds + bedsDelta));
      const newOccupancy = Math.round(Math.max(0.1, Math.min(1.0, state.occupancy + occupancyDelta)) * 10000) / 10000;

      hospitalStates.set(id, {
        beds: newBeds,
        occupancy: newOccupancy,
      });
    });

    console.log('[Simulator] tick — states updated');
  }, 10000);
}
