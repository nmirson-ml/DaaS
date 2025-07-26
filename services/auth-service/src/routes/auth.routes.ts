import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '../services/auth.service'
import { AuthMiddleware } from '../middleware/auth.middleware'
import { logger } from '../utils/logger'
import { AuthError, ValidationError } from '../utils/errors'
import type { 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest,
  ChangePasswordRequest,
  ApiResponse 
} from '@platform/shared-types'

const authService = new AuthService()
const authMiddleware = new AuthMiddleware()

export async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post<{
    Body: LoginRequest
  }>('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                tenant: { type: 'object' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
    try {
      const metadata = {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      }

      const result = await authService.login(request.body, metadata)

      return reply.status(200).send({
        success: true,
        data: result,
      })
    } catch (error) {
      logger.error({
        error: error.message,
        email: request.body.email,
        ip: request.ip,
      }, 'Login failed')

      if (error instanceof AuthError || error instanceof ValidationError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
          },
        })
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed due to an internal error',
          statusCode: 500,
        },
      })
    }
  })

  // Register endpoint
  fastify.post<{
    Body: RegisterRequest
  }>('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          tenantName: { type: 'string', minLength: 1 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                tenant: { type: 'object' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
    try {
      const metadata = {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      }

      const result = await authService.register(request.body, metadata)

      return reply.status(201).send({
        success: true,
        data: result,
      })
    } catch (error) {
      logger.error({
        error: error.message,
        email: request.body.email,
        ip: request.ip,
      }, 'Registration failed')

      if (error instanceof AuthError || error instanceof ValidationError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            field: error.field,
            statusCode: error.statusCode,
          },
        })
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Registration failed due to an internal error',
          statusCode: 500,
        },
      })
    }
  })

  // Refresh token endpoint
  fastify.post<{
    Body: RefreshTokenRequest
  }>('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: RefreshTokenRequest }>, reply: FastifyReply) => {
    try {
      const metadata = {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      }

      const result = await authService.refreshToken(request.body.refreshToken, metadata)

      return reply.status(200).send({
        success: true,
        data: result,
      })
    } catch (error) {
      logger.error({
        error: error.message,
        ip: request.ip,
      }, 'Token refresh failed')

      if (error instanceof AuthError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
          },
        })
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Token refresh failed',
          statusCode: 500,
        },
      })
    }
  })

  // Logout endpoint
  fastify.post('/logout', {
    preHandler: [authMiddleware.authenticate()],
    schema: {
      body: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: { refreshToken?: string } }>, reply: FastifyReply) => {
    try {
      const user = (request as any).user
      await authService.logout(user.userId, request.body.refreshToken)

      return reply.status(200).send({
        success: true,
        data: { message: 'Logged out successfully' },
      })
    } catch (error) {
      logger.error({
        error: error.message,
        userId: (request as any).user?.userId,
      }, 'Logout failed')

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Logout failed',
          statusCode: 500,
        },
      })
    }
  })

  // Change password endpoint
  fastify.post<{
    Body: ChangePasswordRequest
  }>('/change-password', {
    preHandler: [authMiddleware.authenticate()],
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: ChangePasswordRequest }>, reply: FastifyReply) => {
    try {
      const user = (request as any).user
      await authService.changePassword(
        user.userId,
        request.body.currentPassword,
        request.body.newPassword
      )

      return reply.status(200).send({
        success: true,
        data: { message: 'Password changed successfully' },
      })
    } catch (error) {
      logger.error({
        error: error.message,
        userId: (request as any).user?.userId,
      }, 'Password change failed')

      if (error instanceof AuthError || error instanceof ValidationError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
          },
        })
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password change failed',
          statusCode: 500,
        },
      })
    }
  })

  // Get current user profile
  fastify.get('/me', {
    preHandler: [authMiddleware.authenticate()],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user
      const profile = await authService.getUserProfile(user.userId)

      return reply.status(200).send({
        success: true,
        data: profile,
      })
    } catch (error) {
      logger.error({
        error: error.message,
        userId: (request as any).user?.userId,
      }, 'Get profile failed')

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user profile',
          statusCode: 500,
        },
      })
    }
  })

  // Verify token endpoint (for other services)
  fastify.post('/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) => {
    try {
      const result = await authService.verifyToken(request.body.token)

      return reply.status(200).send({
        success: true,
        data: result,
      })
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token verification failed',
          statusCode: 401,
        },
      })
    }
  })
} 