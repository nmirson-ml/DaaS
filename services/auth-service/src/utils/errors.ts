export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
    public readonly code: string = 'AUTH_ERROR'
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly statusCode: number = 400,
    public readonly code: string = 'VALIDATION_ERROR'
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 403,
    public readonly code: string = 'SECURITY_ERROR'
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Too many requests',
    public readonly retryAfter?: number,
    public readonly statusCode: number = 429,
    public readonly code: string = 'RATE_LIMIT_ERROR'
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'DATABASE_ERROR'
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class TenantError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 403,
    public readonly code: string = 'TENANT_ERROR'
  ) {
    super(message)
    this.name = 'TenantError'
  }
}

// Error codes for consistent API responses
export const ErrorCodes = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',

  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_EMAIL: 'INVALID_EMAIL',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  TENANT_SUBDOMAIN_EXISTS: 'TENANT_SUBDOMAIN_EXISTS',

  // Rate Limiting
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  TOO_MANY_LOGIN_ATTEMPTS: 'TOO_MANY_LOGIN_ATTEMPTS',

  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]