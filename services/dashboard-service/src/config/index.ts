import { z } from 'zod'

const configSchema = z.object({
  // Server
  port: z.coerce.number().min(1).max(65535).default(3003),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Database
  databaseUrl: z.string().url(),

  // External Services
  authServiceUrl: z.string().url().default('http://localhost:3001'),
  queryEngineUrl: z.string().url().default('http://localhost:3002'),
  visualizationServiceUrl: z.string().url().default('http://localhost:3004'),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(900000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().default(1000),

  // Dashboard Limits
  maxWidgetsPerDashboard: z.coerce.number().default(50),
  maxDashboardsPerTenant: z.coerce.number().default(100),
  maxVersionsPerDashboard: z.coerce.number().default(10),

  // File Upload
  maxFileSize: z.coerce.number().default(5 * 1024 * 1024), // 5MB
  uploadPath: z.string().default('./uploads'),

  // CORS
  corsOrigin: z.string().default('*'),

  // Metrics
  metricsEnabled: z.coerce.boolean().default(true),
  metricsPrefix: z.string().default('dashboard_service_'),
})

type Config = z.infer<typeof configSchema>

const parseConfig = (): Config => {
  try {
    return configSchema.parse({
      // Server
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL,

      // Database
      databaseUrl: process.env.DATABASE_URL,

      // External Services
      authServiceUrl: process.env.AUTH_SERVICE_URL,
      queryEngineUrl: process.env.QUERY_ENGINE_URL,
      visualizationServiceUrl: process.env.VISUALIZATION_SERVICE_URL,

      // Rate Limiting
      rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,

      // Dashboard Limits
      maxWidgetsPerDashboard: process.env.MAX_WIDGETS_PER_DASHBOARD,
      maxDashboardsPerTenant: process.env.MAX_DASHBOARDS_PER_TENANT,
      maxVersionsPerDashboard: process.env.MAX_VERSIONS_PER_DASHBOARD,

      // File Upload
      maxFileSize: process.env.MAX_FILE_SIZE,
      uploadPath: process.env.UPLOAD_PATH,

      // CORS
      corsOrigin: process.env.CORS_ORIGIN,

      // Metrics
      metricsEnabled: process.env.METRICS_ENABLED,
      metricsPrefix: process.env.METRICS_PREFIX,
    })
  } catch (error) {
    console.error('Configuration validation failed:', error)
    process.exit(1)
  }
}

export const config = parseConfig()
export type { Config } 