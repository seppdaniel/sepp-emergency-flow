import { FastifyInstance } from 'fastify';
import { EmergencyType, Hospital, HospitalBase } from '../../../lib/types';
import { getHospitalSnapshot } from '../simulator';
import { rankHospitals, EMERGENCY_WEIGHTS } from '../../../lib/decisionEngine';
import { prisma } from '../db';

const VALID_EMERGENCY_TYPES: EmergencyType[] = [
  'heart_attack',
  'stroke',
  'accident',
  'breathing_problem',
  'severe_bleeding',
];

interface DecisionBody {
  emergencyType: string;
  hospitals?: (HospitalBase & { beds: number; occupancy: number })[];
}

function generateReasoning(best: Hospital, emergencyType: EmergencyType): string {
  const weights = EMERGENCY_WEIGHTS[emergencyType];
  
  let highestKey = 'time';
  let highestValue = 0;
  
  const keys = ['time', 'distance', 'beds', 'occupancy', 'specialtyBonus'] as const;
  keys.forEach((key) => {
    if (weights[key] > highestValue) {
      highestValue = weights[key];
      highestKey = key;
    }
  });

  if (highestKey === 'time') {
    return `Selected for fastest response time of ${best.estimatedTime} min, critical for ${emergencyType} cases.`;
  }
  if (highestKey === 'distance') {
    return `Selected for closest distance of ${best.distance} km, critical for ${emergencyType} cases.`;
  }
  if (highestKey === 'beds') {
    return `Selected for ${best.beds} available beds, ensuring immediate care.`;
  }
  if (highestKey === 'occupancy') {
    return `Selected for low occupancy of ${Math.round((1 - best.occupancy) * 100)}%, maximizing attention speed.`;
  }
  return `Selected for specialized care matching ${emergencyType} requirements.`;
}

export async function decisionRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: DecisionBody }>('/api/decision', async (request, reply) => {
    const { emergencyType, hospitals } = request.body;

    if (!emergencyType || !VALID_EMERGENCY_TYPES.includes(emergencyType as EmergencyType)) {
      return reply.status(400).send({ error: 'Invalid emergency type' });
    }

    try {
      const snapshot = hospitals || getHospitalSnapshot();
      const ranked = rankHospitals(snapshot, emergencyType as EmergencyType);
      const reasoning = generateReasoning(ranked[0], emergencyType as EmergencyType);

      prisma.decisionRecord.create({
        data: {
          emergencyType: emergencyType as string,
          bestHospitalName: ranked[0].name,
          bestHospitalScore: ranked[0].score,
          reasoning,
        },
      }).catch((err) => fastify.log.error('DB write failed:', err));

      return reply.status(200).send({
        best: ranked[0],
        alternatives: ranked.slice(1, 4),
        reasoning,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
