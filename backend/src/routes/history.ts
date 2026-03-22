import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { historyQuerySchema } from '../validation/schemas';

interface HistoryQuery {
  limit?: string;
}

export async function historyRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Querystring: HistoryQuery }>('/api/history', async (request, reply) => {
    const parseResult = historyQuerySchema.safeParse(request.query);
    
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Invalid query parameters' });
    }
    
    const { limit } = parseResult.data;

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
