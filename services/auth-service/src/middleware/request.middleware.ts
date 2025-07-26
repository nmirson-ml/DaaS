import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '../utils/logger'

export async function requestLogger(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now()
    request.log.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      requestId: request.id,
    }, 'Request started')

    // Add request start time for duration calculation
    ;(request as any).startTime = startTime
  })

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = Date.now() - ((request as any).startTime || Date.now())
    
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      ip: request.ip,
      requestId: request.id,
    }, 'Request completed')
  })

  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    const duration = Date.now() - ((request as any).startTime || Date.now())
    
    request.log.error({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      error: error.message,
      ip: request.ip,
      requestId: request.id,
    }, 'Request failed')
  })
} 