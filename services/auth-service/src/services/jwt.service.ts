import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { config } from '@/config'
import { logger } from '@/utils/logger'
import { AuthError, ErrorCodes } from '@/utils/errors'
import type { TokenPayload, UserRole } from '@platform/shared-types'

interface TokenOptions {
  userId: string
  email: string
  tenantId: string
  role: UserRole
  permissions: string[]
}

interface RefreshTokenOptions {
  userId: string
  tenantId: string
  tokenId: string
}

export class JWTService {
  private readonly secret: Uint8Array
  private readonly issuer = 'platform-auth-service'
  private readonly audience = 'platform-api'

  constructor() {
    this.secret = new TextEncoder().encode(config.jwtSecret)
  }

  /**
   * Generate an access token
   */
  async generateAccessToken(options: TokenOptions): Promise<string> {
    try {
      const payload: TokenPayload = {
        sub: options.userId,
        email: options.email,
        tenant_id: options.tenantId,
        role: options.role,
        permissions: options.permissions,
        iat: Math.floor(Date.now() / 1000),
        exp: 0, // Will be set by SignJWT
      }

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setIssuer(this.issuer)
        .setAudience(this.audience)
        .setExpirationTime(config.jwtAccessTokenExpiresIn)
        .sign(this.secret)

      logger.debug('Access token generated', { 
        userId: options.userId, 
        tenantId: options.tenantId 
      })

      return token
    } catch (error) {
      logger.error('Failed to generate access token', {
        error: error.message,
        userId: options.userId,
      })
      throw new AuthError('Token generation failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Generate a refresh token
   */
  async generateRefreshToken(options: RefreshTokenOptions): Promise<string> {
    try {
      const payload = {
        sub: options.userId,
        tenant_id: options.tenantId,
        token_id: options.tokenId,
        type: 'refresh',
      }

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setIssuer(this.issuer)
        .setAudience(this.audience)
        .setExpirationTime(config.jwtRefreshTokenExpiresIn)
        .sign(this.secret)

      logger.debug('Refresh token generated', { 
        userId: options.userId, 
        tenantId: options.tenantId,
        tokenId: options.tokenId 
      })

      return token
    } catch (error) {
      logger.error('Failed to generate refresh token', {
        error: error.message,
        userId: options.userId,
      })
      throw new AuthError('Refresh token generation failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Verify and decode an access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
      })

      // Validate required fields
      if (!payload.sub || !payload.email || !payload.tenant_id || !payload.role) {
        throw new AuthError('Invalid token payload', 401, ErrorCodes.TOKEN_INVALID)
      }

      return payload as TokenPayload
    } catch (error) {
      if (error.code === 'ERR_JWT_EXPIRED') {
        logger.debug('Access token expired', { token: this.maskToken(token) })
        throw new AuthError('Token expired', 401, ErrorCodes.TOKEN_EXPIRED)
      }

      if (error.code?.startsWith('ERR_JWT_')) {
        logger.debug('Invalid access token', { 
          token: this.maskToken(token),
          error: error.message 
        })
        throw new AuthError('Invalid token', 401, ErrorCodes.TOKEN_INVALID)
      }

      logger.error('Token verification failed', {
        error: error.message,
        token: this.maskToken(token),
      })
      throw new AuthError('Token verification failed', 401, ErrorCodes.TOKEN_INVALID)
    }
  }

  /**
   * Verify and decode a refresh token
   */
  async verifyRefreshToken(token: string): Promise<{
    userId: string
    tenantId: string
    tokenId: string
  }> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
      })

      if (!payload.sub || !payload.tenant_id || !payload.token_id || payload.type !== 'refresh') {
        throw new AuthError('Invalid refresh token payload', 401, ErrorCodes.REFRESH_TOKEN_INVALID)
      }

      return {
        userId: payload.sub as string,
        tenantId: payload.tenant_id as string,
        tokenId: payload.token_id as string,
      }
    } catch (error) {
      if (error.code === 'ERR_JWT_EXPIRED') {
        logger.debug('Refresh token expired', { token: this.maskToken(token) })
        throw new AuthError('Refresh token expired', 401, ErrorCodes.REFRESH_TOKEN_INVALID)
      }

      if (error.code?.startsWith('ERR_JWT_')) {
        logger.debug('Invalid refresh token', { 
          token: this.maskToken(token),
          error: error.message 
        })
        throw new AuthError('Invalid refresh token', 401, ErrorCodes.REFRESH_TOKEN_INVALID)
      }

      logger.error('Refresh token verification failed', {
        error: error.message,
        token: this.maskToken(token),
      })
      throw new AuthError('Refresh token verification failed', 401, ErrorCodes.REFRESH_TOKEN_INVALID)
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractBearerToken(authHeader?: string): string | null {
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null
    }

    return parts[1] || null
  }

  /**
   * Get token expiration time in seconds
   */
  getTokenExpirationSeconds(expiresIn: string): number {
    const unit = expiresIn.slice(-1)
    const value = parseInt(expiresIn.slice(0, -1))

    switch (unit) {
      case 's':
        return value
      case 'm':
        return value * 60
      case 'h':
        return value * 60 * 60
      case 'd':
        return value * 24 * 60 * 60
      default:
        return 900 // Default 15 minutes
    }
  }

  /**
   * Mask token for logging (show only first and last 4 characters)
   */
  private maskToken(token: string): string {
    if (token.length <= 8) {
      return '***'
    }
    return `${token.slice(0, 4)}...${token.slice(-4)}`
  }
}