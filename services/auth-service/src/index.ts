import fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import { config } from './config'
import { logger } from './utils/logger'
import { authRoutes } from './routes/auth.routes'
import { healthRoutes } from './routes/health.routes'
import { errorHandler } from './middleware/error.middleware'
import { requestLogger } from './middleware/request.middleware'

const server = fastify({
  logger: logger,
  trustProxy: true,
  requestTimeout: 30000,
  bodyLimit: 1024 * 1024, // 1MB
})

async function buildServer() {
  try {
    // Register plugins
    await server.register(sensible)
    
    await server.register(helmet, {
      contentSecurityPolicy: false, // Allow embedding
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

    // Register middleware
    await server.register(requestLogger)
    await server.register(errorHandler)

    // Register routes
    await server.register(healthRoutes, { prefix: '/health' })
    await server.register(authRoutes, { prefix: '/auth' })

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
    logger.error(error, 'Failed to build server')
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
    }, 'Auth service started successfully')

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM']
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully`)
        try {
          await app.close()
          logger.info('Server closed successfully')
          process.exit(0)
        } catch (error) {
          logger.error(error, 'Error during graceful shutdown')
          process.exit(1)
        }
      })
    })

  } catch (error) {
    logger.error(error, 'Failed to start server')
    process.exit(1)
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer()
}

export { buildServer, startServer } 