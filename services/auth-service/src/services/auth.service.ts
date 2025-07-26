import { z } from 'zod'
import { db } from './database.service'
import { JWTService } from './jwt.service'
import { PasswordService } from '@/utils/password'
import { logger } from '@/utils/logger'
import { 
  AuthError, 
  ValidationError, 
  SecurityError,
  ErrorCodes 
} from '@/utils/errors'
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User, 
  Tenant,
  TokenPayload,
  UserRole 
} from '@platform/shared-types'
import { UserRole as PrismaUserRole, TenantPlan } from '@/generated/prisma'

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  tenantName: z.string().min(1, 'Organization name is required').optional(),
})

interface SecurityEventData {
  userId?: string
  tenantId?: string
  ipAddress?: string
  userAgent?: string
  eventType: string
  description: string
  metadata?: Record<string, any>
}

export class AuthService {
  private jwtService: JWTService

  constructor() {
    this.jwtService = new JWTService()
  }

  /**
   * User login with security controls
   */
  async login(
    request: LoginRequest, 
    metadata: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<AuthResponse> {
    const { email, password } = loginSchema.parse(request)

    try {
      // Check for account lockout
      await this.checkAccountLockout(email, metadata.ipAddress)

      // Find user by email
      const user = await db.client.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          tenants: {
            include: {
              tenant: true,
            },
            where: {
              isActive: true,
            },
          },
        },
      })

      if (!user) {
        await this.recordFailedLogin(email, 'User not found', metadata)
        throw new AuthError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS)
      }

      if (!user.isActive) {
        await this.recordSecurityEvent({
          userId: user.id,
          eventType: 'LOGIN_FAILED',
          description: 'Login attempt on inactive account',
          ...metadata,
        })
        throw new AuthError('Account is inactive', 401, ErrorCodes.ACCOUNT_INACTIVE)
      }

      // Verify password
      const isPasswordValid = await PasswordService.verify(password, user.passwordHash)
      if (!isPasswordValid) {
        await this.recordFailedLogin(email, 'Invalid password', metadata, user.id)
        throw new AuthError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS)
      }

      // Get primary tenant (first active tenant or create default)
      let primaryTenant = user.tenants[0]?.tenant
      let userRole: UserRole = user.tenants[0]?.role as UserRole || 'viewer'
      let permissions = user.tenants[0]?.permissions as string[] || []

      if (!primaryTenant) {
        // Create default personal tenant for user
        const tenant = await this.createDefaultTenant(user.id, user.email)
        primaryTenant = tenant
        userRole = 'admin'
        permissions = ['*']
      }

      // Generate tokens
      const accessToken = await this.jwtService.generateAccessToken({
        userId: user.id,
        email: user.email,
        tenantId: primaryTenant.id,
        role: userRole,
        permissions,
      })

      const refreshTokenRecord = await db.client.refreshToken.create({
        data: {
          userId: user.id,
          tenantId: primaryTenant.id,
          token: '', // Will be updated with the actual token
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          userAgent: metadata.userAgent?.substring(0, 500),
          ipAddress: metadata.ipAddress,
        },
      })

      const refreshToken = await this.jwtService.generateRefreshToken({
        userId: user.id,
        tenantId: primaryTenant.id,
        tokenId: refreshTokenRecord.id,
      })

      // Update refresh token record with the actual token hash
      await db.client.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: { token: await this.hashToken(refreshToken) },
      })

      // Update last login time
      await db.client.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })

      // Clear any failed login attempts
      await this.clearFailedLoginAttempts(email, metadata.ipAddress)

      // Record successful login
      await this.recordSecurityEvent({
        userId: user.id,
        tenantId: primaryTenant.id,
        eventType: 'LOGIN_SUCCESS',
        description: 'User logged in successfully',
        ...metadata,
      })

      const response: AuthResponse = {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tenant: {
          id: primaryTenant.id,
          name: primaryTenant.name,
          subdomain: primaryTenant.subdomain,
          plan: primaryTenant.plan.toLowerCase() as 'free' | 'pro' | 'enterprise',
          settings: primaryTenant.settings as Record<string, any>,
          createdAt: primaryTenant.createdAt,
          updatedAt: primaryTenant.updatedAt,
        },
        expiresIn: this.jwtService.getTokenExpirationSeconds('15m'),
      }

      logger.info('User logged in successfully', { 
        userId: user.id, 
        tenantId: primaryTenant.id,
        email: user.email 
      })

      return response
    } catch (error) {
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error
      }

      logger.error('Login failed', { 
        email, 
        error: error.message,
        ...metadata 
      })
      throw new AuthError('Login failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * User registration with tenant creation
   */
  async register(
    request: RegisterRequest,
    metadata: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<AuthResponse> {
    const { email, password, firstName, lastName, tenantName } = registerSchema.parse(request)

    try {
      // Check if email already exists
      const existingUser = await db.client.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUser) {
        throw new ValidationError(
          'Email address is already registered',
          'email',
          400,
          ErrorCodes.EMAIL_ALREADY_EXISTS
        )
      }

      // Validate password strength
      const passwordValidation = PasswordService.validatePassword(password)
      if (!passwordValidation.isValid) {
        throw new ValidationError(
          passwordValidation.errors.join(', '),
          'password',
          400,
          ErrorCodes.WEAK_PASSWORD
        )
      }

      // Hash password
      const passwordHash = await PasswordService.hash(password)

      // Create user and tenant in transaction
      const result = await db.transaction(async (prisma) => {
        // Create user
        const user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            firstName,
            lastName,
          },
        })

        // Create tenant
        const subdomain = this.generateSubdomain(tenantName || email)
        const tenant = await prisma.tenant.create({
          data: {
            name: tenantName || `${firstName || email}'s Organization`,
            subdomain,
            plan: TenantPlan.FREE,
            settings: {},
          },
        })

        // Create user-tenant relationship
        await prisma.userTenant.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            role: PrismaUserRole.ADMIN,
            permissions: ['*'],
            joinedAt: new Date(),
          },
        })

        return { user, tenant }
      })

      // Generate tokens
      const accessToken = await this.jwtService.generateAccessToken({
        userId: result.user.id,
        email: result.user.email,
        tenantId: result.tenant.id,
        role: 'admin',
        permissions: ['*'],
      })

      const refreshTokenRecord = await db.client.refreshToken.create({
        data: {
          userId: result.user.id,
          tenantId: result.tenant.id,
          token: '',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userAgent: metadata.userAgent?.substring(0, 500),
          ipAddress: metadata.ipAddress,
        },
      })

      const refreshToken = await this.jwtService.generateRefreshToken({
        userId: result.user.id,
        tenantId: result.tenant.id,
        tokenId: refreshTokenRecord.id,
      })

      await db.client.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: { token: await this.hashToken(refreshToken) },
      })

      // Record registration event
      await this.recordSecurityEvent({
        userId: result.user.id,
        tenantId: result.tenant.id,
        eventType: 'REGISTRATION',
        description: 'User registered successfully',
        ...metadata,
      })

      const response: AuthResponse = {
        token: accessToken,
        refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName || undefined,
          lastName: result.user.lastName || undefined,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          subdomain: result.tenant.subdomain,
          plan: result.tenant.plan.toLowerCase() as 'free' | 'pro' | 'enterprise',
          settings: result.tenant.settings as Record<string, any>,
          createdAt: result.tenant.createdAt,
          updatedAt: result.tenant.updatedAt,
        },
        expiresIn: this.jwtService.getTokenExpirationSeconds('15m'),
      }

      logger.info('User registered successfully', { 
        userId: result.user.id, 
        tenantId: result.tenant.id,
        email: result.user.email 
      })

      return response
    } catch (error) {
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error
      }

      logger.error('Registration failed', { 
        email, 
        error: error.message,
        ...metadata 
      })
      throw new AuthError('Registration failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshToken: string,
    metadata: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const tokenPayload = await this.jwtService.verifyRefreshToken(refreshToken)

      // Find refresh token record
      const tokenRecord = await db.client.refreshToken.findFirst({
        where: {
          id: tokenPayload.tokenId,
          userId: tokenPayload.userId,
          tenantId: tokenPayload.tenantId,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: {
              tenants: {
                include: { tenant: true },
                where: { 
                  tenantId: tokenPayload.tenantId,
                  isActive: true 
                },
              },
            },
          },
        },
      })

      if (!tokenRecord) {
        throw new AuthError('Refresh token not found or expired', 401, ErrorCodes.REFRESH_TOKEN_INVALID)
      }

      // Verify token hash
      const isTokenValid = await this.verifyTokenHash(refreshToken, tokenRecord.token)
      if (!isTokenValid) {
        await this.recordSecurityEvent({
          userId: tokenRecord.userId,
          tenantId: tokenRecord.tenantId,
          eventType: 'SUSPICIOUS_ACTIVITY',
          description: 'Invalid refresh token hash attempted',
          ...metadata,
        })
        throw new AuthError('Invalid refresh token', 401, ErrorCodes.REFRESH_TOKEN_INVALID)
      }

      const user = tokenRecord.user
      const userTenant = user.tenants[0]

      if (!user.isActive || !userTenant) {
        throw new AuthError('User or tenant inactive', 401, ErrorCodes.ACCOUNT_INACTIVE)
      }

      // Generate new access token
      const accessToken = await this.jwtService.generateAccessToken({
        userId: user.id,
        email: user.email,
        tenantId: userTenant.tenantId,
        role: userTenant.role as UserRole,
        permissions: userTenant.permissions as string[],
      })

      // Record token refresh event
      await this.recordSecurityEvent({
        userId: user.id,
        tenantId: userTenant.tenantId,
        eventType: 'TOKEN_REFRESH',
        description: 'Access token refreshed',
        ...metadata,
      })

      const response: AuthResponse = {
        token: accessToken,
        refreshToken, // Return the same refresh token
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tenant: userTenant.tenant,
        expiresIn: this.jwtService.getTokenExpirationSeconds('15m'),
      }

      logger.debug('Token refreshed successfully', { 
        userId: user.id, 
        tenantId: userTenant.tenantId 
      })

      return response
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }

      logger.error('Token refresh failed', { 
        error: error.message,
        ...metadata 
      })
      throw new AuthError('Token refresh failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<TokenPayload> {
    return await this.jwtService.verifyAccessToken(token)
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string, tenantId: string): Promise<{
    user: User
    tenant: Tenant
    role: UserRole
    permissions: string[]
  }> {
    try {
      const userTenant = await db.client.userTenant.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId,
          },
        },
        include: {
          user: true,
          tenant: true,
        },
      })

      if (!userTenant || !userTenant.isActive) {
        throw new AuthError('User not found in tenant', 404, ErrorCodes.RESOURCE_NOT_FOUND)
      }

      return {
        user: {
          id: userTenant.user.id,
          email: userTenant.user.email,
          firstName: userTenant.user.firstName || undefined,
          lastName: userTenant.user.lastName || undefined,
          createdAt: userTenant.user.createdAt,
          updatedAt: userTenant.user.updatedAt,
        },
        tenant: {
          id: userTenant.tenant.id,
          name: userTenant.tenant.name,
          subdomain: userTenant.tenant.subdomain,
          plan: userTenant.tenant.plan.toLowerCase() as 'free' | 'pro' | 'enterprise',
          settings: userTenant.tenant.settings as Record<string, any>,
          createdAt: userTenant.tenant.createdAt,
          updatedAt: userTenant.tenant.updatedAt,
        },
        role: userTenant.role as UserRole,
        permissions: userTenant.permissions as string[],
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }

      logger.error('Failed to get user profile', { 
        userId, 
        tenantId, 
        error: error.message 
      })
      throw new AuthError('Failed to get user profile', 500, ErrorCodes.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(
    refreshToken: string,
    metadata: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    try {
      const tokenPayload = await this.jwtService.verifyRefreshToken(refreshToken)

      await db.client.refreshToken.updateMany({
        where: {
          id: tokenPayload.tokenId,
          userId: tokenPayload.userId,
        },
        data: {
          revoked: true,
        },
      })

      await this.recordSecurityEvent({
        userId: tokenPayload.userId,
        tenantId: tokenPayload.tenantId,
        eventType: 'LOGOUT',
        description: 'User logged out',
        ...metadata,
      })

      logger.info('User logged out successfully', { 
        userId: tokenPayload.userId, 
        tenantId: tokenPayload.tenantId 
      })
    } catch (error) {
      logger.error('Logout failed', { error: error.message, ...metadata })
      // Don't throw error for logout - best effort
    }
  }

  // Private helper methods

  private async createDefaultTenant(userId: string, email: string) {
    const subdomain = this.generateSubdomain(email)
    
    return await db.transaction(async (prisma) => {
      const tenant = await prisma.tenant.create({
        data: {
          name: `${email}'s Workspace`,
          subdomain,
          plan: TenantPlan.FREE,
          settings: {},
        },
      })

      await prisma.userTenant.create({
        data: {
          userId,
          tenantId: tenant.id,
          role: PrismaUserRole.ADMIN,
          permissions: ['*'],
          joinedAt: new Date(),
        },
      })

      return tenant
    })
  }

  private generateSubdomain(input: string): string {
    // Extract name part from email or use input directly
    const name = input.includes('@') ? input.split('@')[0] : input
    
    // Clean and format subdomain
    const cleaned = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30)

    // Add random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 8)
    return `${cleaned}-${suffix}`
  }

  private async checkAccountLockout(email: string, ipAddress?: string): Promise<void> {
    // Implementation would check failed login attempts and lockout status
    // This is a simplified version
  }

  private async recordFailedLogin(
    email: string, 
    reason: string, 
    metadata: { ipAddress?: string; userAgent?: string },
    userId?: string
  ): Promise<void> {
    await this.recordSecurityEvent({
      userId,
      eventType: 'LOGIN_FAILED',
      description: `Login failed: ${reason}`,
      metadata: { email },
      ...metadata,
    })
  }

  private async clearFailedLoginAttempts(email: string, ipAddress?: string): Promise<void> {
    // Implementation would clear failed login attempt counters
  }

  private async recordSecurityEvent(data: SecurityEventData): Promise<void> {
    try {
      await db.client.securityEvent.create({
        data: {
          userId: data.userId,
          tenantId: data.tenantId,
          eventType: data.eventType as any,
          description: data.description,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent?.substring(0, 500),
          metadata: data.metadata || {},
          severity: this.getEventSeverity(data.eventType),
        },
      })
    } catch (error) {
      logger.error('Failed to record security event', { error: error.message, data })
    }
  }

  private getEventSeverity(eventType: string): 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' {
    const criticalEvents = ['ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY']
    const warningEvents = ['LOGIN_FAILED', 'PERMISSION_DENIED']
    const errorEvents = ['TOKEN_REVOKED']

    if (criticalEvents.includes(eventType)) return 'CRITICAL'
    if (warningEvents.includes(eventType)) return 'WARNING'
    if (errorEvents.includes(eventType)) return 'ERROR'
    return 'INFO'
  }

  private async hashToken(token: string): Promise<string> {
    return await PasswordService.hash(token)
  }

  private async verifyTokenHash(token: string, hash: string): Promise<boolean> {
    return await PasswordService.verify(token, hash)
  }
}