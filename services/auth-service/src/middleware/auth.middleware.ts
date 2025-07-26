import type { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '@/services/auth.service'
import { JWTService } from '@/services/jwt.service'
import { logger } from '@/utils/logger'
import { AuthError, ErrorCodes } from '@/utils/errors'
import type { TokenPayload } from '@platform/shared-types'

// Extend FastifyRequest to include user context
declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload
    tenantId?: string
    userId?: string
    permissions?: string[]
    role?: string
  }
}

interface AuthMiddlewareOptions {
  required?: boolean
  permissions?: string[]
  roles?: string[]
}

export class AuthMiddleware {
  private jwtService: JWTService

  constructor() {
    this.jwtService = new JWTService()
  }

  /**
   * Middleware to authenticate requests using JWT tokens
   */
  authenticate(options: AuthMiddlewareOptions = { required: true }) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization
        const token = this.jwtService.extractBearerToken(authHeader)

        if (!token) {
          if (options.required) {
            throw new AuthError('Authorization token required', 401, ErrorCodes.TOKEN_INVALID)
          }
          return // Continue without authentication for optional auth
        }

        // Verify and decode token
        const payload = await this.jwtService.verifyAccessToken(token)

        // Attach user context to request
        request.user = payload
        request.userId = payload.sub
        request.tenantId = payload.tenant_id
        request.permissions = payload.permissions
        request.role = payload.role

        // Check role requirements
        if (options.roles && options.roles.length > 0) {
          if (!options.roles.includes(payload.role)) {
            logger.security('ACCESS_DENIED', 'Insufficient role permissions', {
              userId: payload.sub,
              tenantId: payload.tenant_id,
              requiredRoles: options.roles,
              userRole: payload.role,
              endpoint: request.url,
            })
            throw new AuthError('Insufficient permissions', 403, ErrorCodes.INSUFFICIENT_PERMISSIONS)
          }
        }

        // Check permission requirements
        if (options.permissions && options.permissions.length > 0) {
          const hasPermission = this.checkPermissions(payload.permissions, options.permissions)
          if (!hasPermission) {
            logger.security('ACCESS_DENIED', 'Insufficient permissions', {
              userId: payload.sub,
              tenantId: payload.tenant_id,
              requiredPermissions: options.permissions,
              userPermissions: payload.permissions,
              endpoint: request.url,
            })
            throw new AuthError('Insufficient permissions', 403, ErrorCodes.INSUFFICIENT_PERMISSIONS)
          }
        }

        logger.debug('Request authenticated successfully', {
          userId: payload.sub,
          tenantId: payload.tenant_id,
          role: payload.role,
          endpoint: request.url,
        })

      } catch (error) {
        if (error instanceof AuthError) {
          reply.code(error.statusCode).send({
            success: false,
            error: {
              code: error.code,
              message: error.message,
            },
          })
          return
        }

        logger.error('Authentication middleware error', {
          error: error.message,
          endpoint: request.url,
        })

        reply.code(500).send({
          success: false,
          error: {
            code: ErrorCodes.INTERNAL_SERVER_ERROR,
            message: 'Authentication failed',
          },
        })
      }
    }
  }

  /**
   * Middleware to ensure tenant isolation
   */
  tenantIsolation() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // This middleware should run after authentication
        if (!request.tenantId) {
          throw new AuthError('Tenant context required', 403, ErrorCodes.TENANT_ACCESS_DENIED)
        }

        // Check if the requested resource belongs to the user's tenant
        const resourceTenantId = this.extractTenantFromRequest(request)
        
        if (resourceTenantId && resourceTenantId !== request.tenantId) {
          logger.security('TENANT_ISOLATION_VIOLATION', 'Cross-tenant access attempt', {
            userId: request.userId,
            userTenantId: request.tenantId,
            requestedTenantId: resourceTenantId,
            endpoint: request.url,
            method: request.method,
          })
          
          throw new AuthError('Access denied to tenant resource', 403, ErrorCodes.TENANT_ACCESS_DENIED)
        }

        logger.debug('Tenant isolation check passed', {
          userId: request.userId,
          tenantId: request.tenantId,
          endpoint: request.url,
        })

      } catch (error) {
        if (error instanceof AuthError) {
          reply.code(error.statusCode).send({
            success: false,
            error: {
              code: error.code,
              message: error.message,
            },
          })
          return
        }

        logger.error('Tenant isolation middleware error', {
          error: error.message,
          endpoint: request.url,
        })

        reply.code(500).send({
          success: false,
          error: {
            code: ErrorCodes.INTERNAL_SERVER_ERROR,
            message: 'Tenant validation failed',
          },
        })
      }
    }
  }

  /**
   * Admin-only middleware
   */
  requireAdmin() {
    return this.authenticate({ 
      required: true, 
      roles: ['admin'] 
    })
  }

  /**
   * Editor or higher middleware
   */
  requireEditor() {
    return this.authenticate({ 
      required: true, 
      roles: ['admin', 'editor'] 
    })
  }

  /**
   * Optional authentication (for public endpoints that can benefit from user context)
   */
  optionalAuth() {
    return this.authenticate({ required: false })
  }

  /**
   * Check if user has required permissions
   */
  private checkPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    // Wildcard permission grants everything
    if (userPermissions.includes('*')) {
      return true
    }

    // Check if user has all required permissions
    return requiredPermissions.every(permission => {
      // Check exact match
      if (userPermissions.includes(permission)) {
        return true
      }

      // Check wildcard patterns (e.g., 'dashboards.*' matches 'dashboards.read')
      return userPermissions.some(userPerm => {
        if (userPerm.endsWith('*')) {
          const prefix = userPerm.slice(0, -1)
          return permission.startsWith(prefix)
        }
        return false
      })
    })
  }

  /**
   * Extract tenant ID from request (from path params, query params, or body)
   */
  private extractTenantFromRequest(request: FastifyRequest): string | null {
    // Check path parameters
    const pathParams = request.params as any
    if (pathParams?.tenantId) {
      return pathParams.tenantId
    }

    // Check query parameters
    const queryParams = request.query as any
    if (queryParams?.tenantId) {
      return queryParams.tenantId
    }

    // Check request body
    const body = request.body as any
    if (body?.tenantId) {
      return body.tenantId
    }

    return null
  }
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware()