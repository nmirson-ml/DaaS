import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { dashboardRoutes } from './routes/dashboard.routes';
import { logger } from './utils/logger';
import { config } from './config';

const fastify = Fastify({
  logger: {
    level: config.logLevel,
  },
});

async function start() {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: true,
      credentials: true,
    });

    await fastify.register(helmet);

    // Register routes
    await fastify.register(dashboardRoutes);

    // Health check
    fastify.get('/health', async () => {
      return { status: 'healthy', service: 'dashboard-service', timestamp: new Date().toISOString() };
    });

    // Start server
    const port = config.port || 3013;
    const host = config.host || '0.0.0.0';

    await fastify.listen({ port, host });
    logger.info(`Dashboard service started on ${host}:${port}`);
  } catch (error) {
    logger.error('Error starting dashboard service:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start(); 