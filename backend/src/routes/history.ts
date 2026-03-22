import { FastifyInstance } from 'fastify';
import { prisma } from '../db';

interface HistoryQuery {
  limit?: string;
}

export async function historyRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Querystring: HistoryQuery }>('/api/history', async (request, reply) => {
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '20', 10)));

    try {
      const records = await prisma.decisionRecord.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
      return reply.status(200).send(records);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
