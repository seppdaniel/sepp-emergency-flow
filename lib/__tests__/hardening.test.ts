import { EmergencyType } from '@/lib/types';
import { calculateHospitalScore, rankHospitals } from '@/lib/decisionEngine';
import { CircuitBreaker } from '@/lib/circuitBreaker';

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
  lat: number;
  lng: number;
}> = {}) => ({
  id: 'test-1',
  name: 'Test Hospital',
  distance: 10,
  estimatedTime: 20,
  beds: 10,
  occupancy: 0.5,
  specialties: [] as EmergencyType[],
  lat: -25.4372,
  lng: -49.2731,
  ...overrides,
});

describe('calculateHospitalScore edge cases', () => {
  describe('Test 6.1 — Zero distance hospital scores near 100', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should score >= 90 for ${emergencyType} with best values`, () => {
        const hospital = createHospital({
          distance: 0,
          estimatedTime: 1,
          beds: 25,
          occupancy: 0.1,
          specialties: [emergencyType],
        });
        const score = calculateHospitalScore(hospital, emergencyType);
        expect(score).toBeGreaterThanOrEqual(90);
      });
    }
  });

  describe('Test 6.2 — Maximum distance hospital scores near 0', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should score <= 20 for ${emergencyType} with worst values`, () => {
        const hospital = createHospital({
          distance: 20,
          estimatedTime: 60,
          beds: 1,
          occupancy: 0.99,
          specialties: [],
        });
        const score = calculateHospitalScore(hospital, emergencyType);
        expect(score).toBeLessThanOrEqual(20);
      });
    }
  });

  describe('Test 6.3 — Score is deterministic', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should return identical scores for ${emergencyType} with same inputs`, () => {
        const hospital = createHospital({
          distance: 5,
          estimatedTime: 15,
          beds: 12,
          occupancy: 0.4,
          specialties: [],
        });
        const score1 = calculateHospitalScore(hospital, emergencyType);
        const score2 = calculateHospitalScore(hospital, emergencyType);
        expect(score1).toBe(score2);
      });
    }
  });
});

describe('rankHospitals edge cases', () => {
  describe('Test 7.1 — Single hospital returns array of one', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should return length 1 for ${emergencyType}`, () => {
        const hospitals = [createHospital({ id: 'only-one' })];
        const ranked = rankHospitals(hospitals, emergencyType);
        expect(ranked.length).toBe(1);
        expect(ranked[0]).toHaveProperty('score');
        expect(ranked[0]).toHaveProperty('status');
      });
    }
  });

  describe('Test 7.2 — All hospitals with identical stats produce valid ranking', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should return valid ranking for ${emergencyType} with identical inputs`, () => {
        const hospitals = [
          createHospital({ id: 'a', distance: 10, beds: 10, occupancy: 0.5, estimatedTime: 20 }),
          createHospital({ id: 'b', distance: 10, beds: 10, occupancy: 0.5, estimatedTime: 20 }),
          createHospital({ id: 'c', distance: 10, beds: 10, occupancy: 0.5, estimatedTime: 20 }),
        ];
        const ranked = rankHospitals(hospitals, emergencyType);
        expect(ranked.length).toBe(3);
        ranked.forEach((h) => {
          expect(['excellent', 'good', 'risk']).toContain(h.status);
        });
      });
    }
  });

  describe('Test 7.3 — rankHospitals never returns negative scores', () => {
    for (const emergencyType of ALL_EMERGENCY_TYPES) {
      it(`should have no negative scores for ${emergencyType}`, () => {
        const hospitals = [
          createHospital({ id: 'a', distance: 20, beds: 0, occupancy: 1.0, estimatedTime: 60 }),
          createHospital({ id: 'b', distance: 20, beds: 0, occupancy: 1.0, estimatedTime: 60 }),
          createHospital({ id: 'c', distance: 20, beds: 0, occupancy: 1.0, estimatedTime: 60 }),
          createHospital({ id: 'd', distance: 20, beds: 0, occupancy: 1.0, estimatedTime: 60 }),
          createHospital({ id: 'e', distance: 20, beds: 0, occupancy: 1.0, estimatedTime: 60 }),
        ];
        const ranked = rankHospitals(hospitals, emergencyType);
        ranked.forEach((h) => {
          expect(h.score).toBeGreaterThanOrEqual(0);
        });
      });
    }
  });
});

describe('CircuitBreaker', () => {
  describe('Test 8.1 — Initial state is closed', () => {
    it('should start in closed state', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeMs: 1000,
        successThreshold: 2,
      });
      expect(breaker.getState()).toBe('closed');
    });
  });

  describe('Test 8.2 — Opens after failureThreshold failures', () => {
    it('should open after 3 failures', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeMs: 1000,
        successThreshold: 2,
      });
      
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('fail');
          });
        } catch {
          // expected
        }
      }
      
      expect(breaker.getState()).toBe('open');
    });
  });

  describe('Test 8.3 — Throws immediately when open', () => {
    it('should throw with OPEN in message when circuit is open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        recoveryTimeMs: 10000,
        successThreshold: 2,
      });

      try {
        await breaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {
        // expected
      }

      await expect(
        breaker.execute(async () => Promise.resolve(42))
      ).rejects.toThrow('OPEN');
    });
  });

  describe('Test 8.4 — Transitions to half-open after recoveryTimeMs', () => {
    it('should allow call after recovery time', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        recoveryTimeMs: 50,
        successThreshold: 2,
      });

      try {
        await breaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {
        // expected
      }

      await new Promise((resolve) => setTimeout(resolve, 60));

      await expect(
        breaker.execute(async () => Promise.resolve(42))
      ).resolves.toBe(42);
    });
  });

  describe('Test 8.5 — Closes after successThreshold successes in half-open', () => {
    it('should close after 2 successes in half-open state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        recoveryTimeMs: 50,
        successThreshold: 2,
      });

      try {
        await breaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {
        // expected
      }

      await new Promise((resolve) => setTimeout(resolve, 60));

      await breaker.execute(async () => Promise.resolve(1));
      await breaker.execute(async () => Promise.resolve(2));

      expect(breaker.getState()).toBe('closed');
    });
  });
});
