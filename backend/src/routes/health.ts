import { FastifyInstance } from 'fastify';
import { prisma } from '../db';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/health', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({
        status: 'ok',
        db: 'connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch {
      return reply.status(503).send({
        status: 'error',
        db: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  });
}
