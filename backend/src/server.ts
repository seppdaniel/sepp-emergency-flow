import Fastify from 'fastify';
import cors from '@fastify/cors';
import { decisionRoutes } from './routes/decision';
import { hospitalRoutes } from './routes/hospitals';
import { historyRoutes } from './routes/history';
import { startSimulator } from './simulator';

const fastify = Fastify({
  logger: true,
});

async function start(): Promise<void> {
  await fastify.register(cors, {
    origin: 'http://localhost:3000',
  });

  await fastify.register(decisionRoutes);
  await fastify.register(hospitalRoutes);
  await fastify.register(historyRoutes);

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
