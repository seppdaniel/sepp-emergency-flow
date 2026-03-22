import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { decisionRoutes } from './routes/decision';
import { hospitalRoutes } from './routes/hospitals';
import { historyRoutes } from './routes/history';
import { metricsRoutes } from './routes/metrics';
import { startSimulator } from './simulator';
import { registerMetricsHook } from './hooks/metricsHook';

const fastify = Fastify({
  logger: true,
});

async function start(): Promise<void> {
  await fastify.register(cors, {
    origin: 'http://localhost:3000',
  });

  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Maximum 60 requests per minute.',
      retryAfter: 60,
    }),
  });

  registerMetricsHook(fastify);

  await fastify.register(decisionRoutes);
  await fastify.register(hospitalRoutes);
  await fastify.register(historyRoutes);
  await fastify.register(metricsRoutes);

  await fastify.listen({
    host: '0.0.0.0',
    port: 3001,
  });

  startSimulator();

  fastify.log.info('Emergency Flow API running on http://localhost:3001');
}

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
