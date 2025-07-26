import { FastifyInstance } from 'fastify'
import { logger } from '../utils/logger'
import { AuthError, ValidationError, SecurityError } from '../utils/errors'

export async function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error, request, reply) => {
    const requestId = request.id
    const logContext = {
      requestId,
      url: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    }

    // Handle known error types
    if (error instanceof AuthError) {
      logger.warn({ ...logContext, error: error.message, code: error.code }, 'Authentication error')
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        },
        requestId,
      })
    }

    if (error instanceof ValidationError) {
      logger.warn({ ...logContext, error: error.message, field: error.field }, 'Validation error')
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.field,
          statusCode: error.statusCode,
        },
        requestId,
      })
    }

    if (error instanceof SecurityError) {
      logger.error({ ...logContext, error: error.message, code: error.code }, 'Security error')
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        },
        requestId,
      })
    }

    // Handle Fastify validation errors
    if (error.validation) {
      logger.warn({ ...logContext, validation: error.validation }, 'Request validation failed')
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.validation,
          statusCode: 400,
        },
        requestId,
      })
    }

    // Handle rate limit errors
    if (error.statusCode === 429) {
      logger.warn({ ...logContext }, 'Rate limit exceeded')
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          statusCode: 429,
        },
        requestId,
      })
    }

    // Handle unexpected errors
    logger.error({ 
      ...logContext, 
      error: error.message, 
      stack: error.stack 
    }, 'Unhandled error')

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        statusCode: 500,
      },
      requestId,
    })
  })
} 