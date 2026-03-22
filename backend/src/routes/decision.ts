import { FastifyInstance } from 'fastify';
import { EmergencyType } from '../../../lib/types';
import { runDecision } from '../../../lib/decisionEngine';

const VALID_EMERGENCY_TYPES: EmergencyType[] = [
  'heart_attack',
  'stroke',
  'accident',
  'breathing_problem',
  'severe_bleeding',
];

interface DecisionBody {
  emergencyType: string;
}

export async function decisionRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: DecisionBody }>('/api/decision', async (request, reply) => {
    const { emergencyType } = request.body;

    if (!emergencyType || !VALID_EMERGENCY_TYPES.includes(emergencyType as EmergencyType)) {
      return reply.status(400).send({ error: 'Invalid emergency type' });
    }

    try {
      const result = runDecision(emergencyType as EmergencyType);
      return reply.status(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
