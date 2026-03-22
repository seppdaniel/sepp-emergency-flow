import { FastifyInstance } from 'fastify';
import { getHospitalSnapshot } from '../simulator';

export async function hospitalRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/hospitals', async (request, reply) => {
    try {
      const snapshot = getHospitalSnapshot();
      return reply.status(200).send(snapshot);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
