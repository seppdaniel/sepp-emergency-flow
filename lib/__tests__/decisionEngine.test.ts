import { EmergencyType } from '@/lib/types';
import {
  calculateHospitalScore,
  getHospitalStatus,
  rankHospitals,
  runDecision,
  EMERGENCY_WEIGHTS,
} from '@/lib/decisionEngine';

const ALL_EMERGENCY_TYPES: EmergencyType[] = [
  'heart_attack',
  'stroke',
  'accident',
  'breathing_problem',
  'severe_bleeding',
];

const createHospital = (overrides: Partial<{
  id: string;
  name: string;
  distance: number;
  estimatedTime: number;
  beds: number;
  occupancy: number;
  specialties: EmergencyType[];
}> = {}) => ({
  id: 'test-1',
  name: 'Test Hospital',
  distance: 10,
  estimatedTime: 20,
  beds: 10,
  occupancy: 0.5,
  specialties: [] as EmergencyType[],
  ...overrides,
});

describe('calculateHospitalScore', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Test 1.1 — Score is always between 0 and 100', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should return score between 0-100 for ${emergencyType} with best values`, () => {
        const hospital = createHospital({
          distance: 0,
          estimatedTime: 1,
          beds: 25,
          occupancy: 0.1,
          specialties: [emergencyType],
        });
        const score = calculateHospitalScore(hospital, emergencyType);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      it(`should return score between 0-100 for ${emergencyType} with worst values`, () => {
        const hospital = createHospital({
          distance: 20,
          estimatedTime: 60,
          beds: 1,
          occupancy: 0.99,
          specialties: [],
        });
        const score = calculateHospitalScore(hospital, emergencyType);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    }
  });

  describe('Test 1.2 — Closer hospital scores higher than distant one', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should favor closer hospital for ${emergencyType}`, () => {
        const hospitalA = createHospital({ distance: 2 });
        const hospitalB = createHospital({ distance: 15 });
        const scoreA = calculateHospitalScore(hospitalA, emergencyType);
        const scoreB = calculateHospitalScore(hospitalB, emergencyType);
        expect(scoreA).toBeGreaterThan(scoreB);
      });
    }
  });

  describe('Test 1.3 — Specialty match increases score', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should give bonus for specialty match for ${emergencyType}`, () => {
        const hospitalA = createHospital({ specialties: [emergencyType] });
        const hospitalB = createHospital({ specialties: [] });
        const scoreA = calculateHospitalScore(hospitalA, emergencyType);
        const scoreB = calculateHospitalScore(hospitalB, emergencyType);
        expect(scoreA).toBeGreaterThan(scoreB);
      });
    }
  });
});

describe('getHospitalStatus', () => {
  describe('Test 2.1 — Status thresholds are correct', () => {
    it('should return excellent for score 75', () => {
      expect(getHospitalStatus(75)).toBe('excellent');
    });

    it('should return good for score 74', () => {
      expect(getHospitalStatus(74)).toBe('good');
    });

    it('should return good for score 55', () => {
      expect(getHospitalStatus(55)).toBe('good');
    });

    it('should return risk for score 54', () => {
      expect(getHospitalStatus(54)).toBe('risk');
    });

    it('should return risk for score 0', () => {
      expect(getHospitalStatus(0)).toBe('risk');
    });

    it('should return excellent for score 100', () => {
      expect(getHospitalStatus(100)).toBe('excellent');
    });
  });
});

describe('rankHospitals', () => {
  describe('Test 3.1 — Returns hospitals sorted by score descending', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should sort by score descending for ${emergencyType}`, () => {
        const hospitals = [
          createHospital({ id: 'a', distance: 15, beds: 10 }),
          createHospital({ id: 'b', distance: 5, beds: 10 }),
          createHospital({ id: 'c', distance: 10, beds: 10 }),
        ];
        const ranked = rankHospitals(hospitals, emergencyType);
        expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
        expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
      });
    }
  });

  describe('Test 3.2 — All returned hospitals have score and status populated', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should populate score and status for ${emergencyType}`, () => {
        const hospitals = [
          createHospital({ id: 'a' }),
          createHospital({ id: 'b' }),
          createHospital({ id: 'c' }),
          createHospital({ id: 'd' }),
        ];
        const ranked = rankHospitals(hospitals, emergencyType);
        ranked.forEach((hospital) => {
          expect(typeof hospital.score).toBe('number');
          expect(['excellent', 'good', 'risk']).toContain(hospital.status);
        });
      });
    }
  });
});

describe('runDecision', () => {
  describe('Test 4.1 — Returns valid DecisionResult shape', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should return valid shape for ${emergencyType}`, () => {
        const result = runDecision(emergencyType);
        expect(result.best).toBeDefined();
        expect(result.best).toHaveProperty('score');
        expect(result.best).toHaveProperty('status');
        expect(Array.isArray(result.alternatives)).toBe(true);
        expect(result.alternatives.length).toBeLessThanOrEqual(3);
        expect(typeof result.reasoning).toBe('string');
        expect(result.reasoning.length).toBeGreaterThan(0);

        const allScores = [result.best.score, ...result.alternatives.map((h) => h.score)];
        expect(result.best.score).toBeGreaterThanOrEqual(Math.max(...result.alternatives.map((h) => h.score)));
      });
    }
  });

  describe('Test 4.2 — Best hospital has highest score among all returned', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should return best with highest score for ${emergencyType}`, () => {
        const result = runDecision(emergencyType);
        const allHospitals = [result.best, ...result.alternatives];
        const maxScore = Math.max(...allHospitals.map((h) => h.score));
        expect(result.best.score).toBe(maxScore);
      });
    }
  });
});

describe('Weight priority validation', () => {
  describe('Test 5.1 — Time-critical emergencies favor faster hospitals', () => {
    const timeCriticalEmergencies: EmergencyType[] = ['heart_attack', 'stroke'];

    for (const emergencyType of timeCriticalEmergencies) {
      it(`should favor faster hospital for ${emergencyType}`, () => {
        const hospitalFast = createHospital({
          estimatedTime: 5,
          distance: 8,
          beds: 10,
          occupancy: 0.5,
          specialties: [],
        });
        const hospitalSlow = createHospital({
          estimatedTime: 25,
          distance: 6,
          beds: 10,
          occupancy: 0.5,
          specialties: [],
        });
        const scoreFast = calculateHospitalScore(hospitalFast, emergencyType);
        const scoreSlow = calculateHospitalScore(hospitalSlow, emergencyType);
        expect(scoreFast).toBeGreaterThan(scoreSlow);
      });
    }
  });

  describe('Test 5.2 — Accident penalizes very distant hospitals', () => {
    it('should penalize distant hospitals for accident', () => {
      const hospitalNear = createHospital({ distance: 3 });
      const hospitalFar = createHospital({ distance: 16 });
      const scoreNear = calculateHospitalScore(hospitalNear, 'accident');
      const scoreFar = calculateHospitalScore(hospitalFar, 'accident');
      expect(scoreNear).toBeGreaterThan(scoreFar);
      expect(scoreNear - scoreFar).toBeGreaterThanOrEqual(20);
    });
  });
});
