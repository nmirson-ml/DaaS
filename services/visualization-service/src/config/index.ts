import { z } from 'zod'

const configSchema = z.object({
  // Server
  port: z.coerce.number().min(1).max(65535).default(3004),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // External Services
  authServiceUrl: z.string().url().default('http://localhost:3001'),
  queryEngineUrl: z.string().url().default('http://localhost:3002'),
  dashboardServiceUrl: z.string().url().default('http://localhost:3003'),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(900000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().default(2000),

  // Chart Generation
  maxChartWidth: z.coerce.number().default(2000),
  maxChartHeight: z.coerce.number().default(1500),
  defaultChartWidth: z.coerce.number().default(800),
  defaultChartHeight: z.coerce.number().default(600),
  chartTimeout: z.coerce.number().default(30000),

  // Caching
  chartCacheTtl: z.coerce.number().default(3600), // 1 hour
  
  // CORS
  corsOrigin: z.string().default('*'),

  // Static Files
  staticPath: z.string().default('./public'),

  // Metrics
  metricsEnabled: z.coerce.boolean().default(true),
  metricsPrefix: z.string().default('viz_service_'),
})

type Config = z.infer<typeof configSchema>

const parseConfig = (): Config => {
  try {
    return configSchema.parse({
      // Server
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL,

      // External Services
      authServiceUrl: process.env.AUTH_SERVICE_URL,
      queryEngineUrl: process.env.QUERY_ENGINE_URL,
      dashboardServiceUrl: process.env.DASHBOARD_SERVICE_URL,

      // Rate Limiting
      rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,

      // Chart Generation
      maxChartWidth: process.env.MAX_CHART_WIDTH,
      maxChartHeight: process.env.MAX_CHART_HEIGHT,
      defaultChartWidth: process.env.DEFAULT_CHART_WIDTH,
      defaultChartHeight: process.env.DEFAULT_CHART_HEIGHT,
      chartTimeout: process.env.CHART_TIMEOUT,

      // Caching
      chartCacheTtl: process.env.CHART_CACHE_TTL,

      // CORS
      corsOrigin: process.env.CORS_ORIGIN,

      // Static Files
      staticPath: process.env.STATIC_PATH,

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