import * as jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface TokenPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class JWTService {
  private secretKey: string;
  private expiresIn: string;

  constructor() {
    // For MVP, use a simple secret (in production, use environment variable)
    this.secretKey = process.env.JWT_SECRET || 'daas-mvp-secret-key-change-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  }

  /**
   * Generate JWT token
   */
  async generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
    try {
      const token = jwt.sign(payload, this.secretKey, {
        expiresIn: this.expiresIn,
        issuer: 'daas-platform',
        audience: 'daas-users'
      });

      logger.info(`JWT token generated for user: ${payload.userId}`);
      return token;
    } catch (error) {
      logger.error('Error generating JWT token:', error);
      throw new Error('Failed to generate token');
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.secretKey, {
        issuer: 'daas-platform',
        audience: 'daas-users'
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        logger.error('Error verifying JWT token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      logger.error('Error decoding JWT token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh token (generate new token with updated expiry)
   */
  async refreshToken(token: string): Promise<string> {
    try {
      const decoded = await this.verifyToken(token);
      
      // Remove timing fields for new token
      const { iat, exp, ...payload } = decoded;
      
      return await this.generateToken(payload);
    } catch (error) {
      logger.error('Error refreshing JWT token:', error);
      throw new Error('Failed to refresh token');
    }
  }
}