import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { decisionRoutes } from './routes/decision';
import { hospitalRoutes } from './routes/hospitals';
import { healthRoutes } from './routes/health';
import { historyRoutes } from './routes/history';
import { metricsRoutes } from './routes/metrics';
import { startSimulator } from './simulator';
import { registerMetricsHook } from './hooks/metricsHook';

const fastify = Fastify({
  logger: true,
});

async function start(): Promise<void> {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        'http://localhost:3000',
        process.env.FRONTEND_URL ?? '',
      ].filter(Boolean);

      if (!origin || allowed.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
  });

  await fastify.register(healthRoutes);

  await fastify.register(rateLimit, {
    global: true,
    max: 60,
    timeWindow: 60000,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    errorResponseBuilder: (_request, context) => {
      return {
        statusCode: 429,
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${context.max} requests per minute.`,
        retryAfter: context.after,
      };
    },
  });

  fastify.setErrorHandler((error, _request, reply) => {
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Maximum 60 requests per minute.',
        retryAfter: 60,
      });
    }
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  });

  registerMetricsHook(fastify);

  await fastify.register(decisionRoutes);
  await fastify.register(hospitalRoutes);
  await fastify.register(historyRoutes);
  await fastify.register(metricsRoutes);

  const PORT = Number(process.env.PORT ?? 3001);
  await fastify.listen({ host: '0.0.0.0', port: PORT });

  startSimulator();

  fastify.log.info('Emergency Flow API running on http://localhost:3001');
}

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
