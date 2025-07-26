import { z } from 'zod'

const configSchema = z.object({
  // Server
  port: z.coerce.number().min(1).max(65535).default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Database
  databaseUrl: z.string().url(),

  // JWT
  jwtSecret: z.string().min(32),
  jwtAccessTokenExpiresIn: z.string().default('15m'),
  jwtRefreshTokenExpiresIn: z.string().default('7d'),

  // Redis
  redisUrl: z.string().url().optional(),

  // Security
  bcryptRounds: z.coerce.number().min(10).max(15).default(12),
  maxLoginAttempts: z.coerce.number().min(1).default(5),
  lockoutTimeMinutes: z.coerce.number().min(1).default(15),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(900000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().default(100),

  // CORS
  corsOrigin: z.string().default('*'),

  // Metrics
  metricsEnabled: z.coerce.boolean().default(true),
  metricsPrefix: z.string().default('auth_service_'),

  // Health Check
  healthCheckTimeout: z.coerce.number().default(5000),
})

function loadConfig() {
  const config = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtAccessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    jwtRefreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
    redisUrl: process.env.REDIS_URL,
    bcryptRounds: process.env.BCRYPT_ROUNDS,
    maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS,
    lockoutTimeMinutes: process.env.LOCKOUT_TIME_MINUTES,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    corsOrigin: process.env.CORS_ORIGIN,
    metricsEnabled: process.env.METRICS_ENABLED,
    metricsPrefix: process.env.METRICS_PREFIX,
    healthCheckTimeout: process.env.HEALTH_CHECK_TIMEOUT,
  }

  try {
    return configSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues
        .filter(issue => issue.code === 'invalid_type' && issue.received === 'undefined')
        .map(issue => issue.path.join('.'))

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missingFields.join(', ')}\n` +
          'Please check your .env file and ensure all required variables are set.'
        )
      }

      throw new Error(`Configuration validation failed: ${error.message}`)
    }
    throw error
  }
}

export const config = loadConfig()

export type Config = typeof config