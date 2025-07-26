import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db } from '../services/database.service'
import { logger } from '../utils/logger'
import { config } from '../config'

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'healthy',
      service: 'auth-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  })

  // Detailed health check with dependencies
  fastify.get('/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    const health = {
      status: 'healthy',
      service: 'auth-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      checks: {
        database: 'unknown',
        memory: 'unknown',
      },
    }

    let overallStatus = 'healthy'

    try {
      // Check database connection
      await db.client.$queryRaw`SELECT 1`
      health.checks.database = 'healthy'
    } catch (error) {
      logger.error(error, 'Database health check failed')
      health.checks.database = 'unhealthy'
      overallStatus = 'unhealthy'
    }

    // Check memory usage
    const memUsage = process.memoryUsage()
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    if (memUsageMB > 500) { // Alert if using more than 500MB
      health.checks.memory = 'warning'
      if (overallStatus === 'healthy') {
        overallStatus = 'warning'
      }
    } else {
      health.checks.memory = 'healthy'
    }

    health.status = overallStatus

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'warning' ? 200 : 503

    return reply.status(statusCode).send(health)
  })

  // Readiness probe
  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if service can handle requests
      await db.client.$queryRaw`SELECT 1`
      
      return reply.status(200).send({
        status: 'ready',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logger.error(error, 'Readiness check failed')
      return reply.status(503).send({
        status: 'not ready',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Liveness probe
  fastify.get('/live', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  })
} 