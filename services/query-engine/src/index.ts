import fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import { config } from './config'
import { logger } from './utils/logger'
import { queryRoutes } from './routes/query.routes'
import { healthRoutes } from './routes/health.routes'
import { QueryService } from './services/query.service'

const server = fastify({
  logger: false, // Use our custom logger
  trustProxy: true,
  requestTimeout: config.queryTimeout + 5000, // Query timeout + buffer
  bodyLimit: 1024 * 1024, // 1MB
})

const queryService = new QueryService()

async function buildServer() {
  try {
    // Register plugins
    await server.register(sensible)
    
    await server.register(helmet, {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })

    await server.register(cors, {
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
      credentials: true,
    })

    await server.register(rateLimit, {
      max: config.rateLimitMaxRequests,
      timeWindow: config.rateLimitWindowMs,
      keyGenerator: (request) => {
        return request.ip || 'anonymous'
      },
      errorResponseBuilder: () => ({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          statusCode: 429,
        },
      }),
    })

    // Add query service to request context
    server.decorate('queryService', queryService)

    // Request logging
    server.addHook('onRequest', async (request) => {
      logger.info({
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        requestId: request.id,
      }, 'Request started')
    })

    server.addHook('onResponse', async (request, reply) => {
      logger.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        ip: request.ip,
        requestId: request.id,
      }, 'Request completed')
    })

    // Register routes
    await server.register(healthRoutes, { prefix: '/health' })
    await server.register(queryRoutes, { prefix: '/query' })

    // Global error handler
    server.setErrorHandler((error, request, reply) => {
      logger.error({
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        headers: request.headers,
      }, 'Unhandled error')

      if (error.validation) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.validation,
            statusCode: 400,
          },
        })
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          statusCode: 500,
        },
      })
    })

    // 404 handler
    server.setNotFoundHandler((request, reply) => {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${request.method} ${request.url} not found`,
          statusCode: 404,
        },
      })
    })

    return server
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to build server')
    throw error
  }
}

async function startServer() {
  try {
    const app = await buildServer()
    
    const address = await app.listen({
      port: config.port,
      host: '0.0.0.0',
    })

    logger.info({
      port: config.port,
      nodeEnv: config.nodeEnv,
      address,
    }, 'Query engine started successfully')

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM']
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully`)
        try {
          await queryService.close()
          await app.close()
          logger.info('Server closed successfully')
          process.exit(0)
        } catch (error) {
          logger.error({ error: (error as Error).message }, 'Error during graceful shutdown')
          process.exit(1)
        }
      })
    })

  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to start server')
    process.exit(1)
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer()
}

export { buildServer, startServer, queryService } 