import { z } from 'zod'

const configSchema = z.object({
  // Server
  port: z.coerce.number().min(1).max(65535).default(3002),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Authentication Service
  authServiceUrl: z.string().url().default('http://localhost:3001'),
  authServiceTimeout: z.coerce.number().default(5000),

  // Redis Cache
  redisUrl: z.string().url().default('redis://localhost:6379'),
  cacheDefaultTtl: z.coerce.number().default(3600), // 1 hour
  cacheMaxMemory: z.string().default('512mb'),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(900000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().default(1000),

  // Query Processing
  queryTimeout: z.coerce.number().default(30000), // 30 seconds
  maxQueryLength: z.coerce.number().default(50000), // 50KB
  maxResultRows: z.coerce.number().default(10000),

  // Data Source Connections
  maxConnectionsPerSource: z.coerce.number().default(10),
  connectionTimeout: z.coerce.number().default(10000),
  
  // Databricks
  databricksServerHostname: z.string().optional(),
  databricksHttpPath: z.string().optional(),
  databricksAccessToken: z.string().optional(),

  // BigQuery
  bigqueryProjectId: z.string().optional(),
  bigqueryKeyFile: z.string().optional(),

  // Snowflake
  snowflakeAccount: z.string().optional(),
  snowflakeUsername: z.string().optional(),
  snowflakePassword: z.string().optional(),
  snowflakeDatabase: z.string().optional(),
  snowflakeWarehouse: z.string().optional(),

  // CORS
  corsOrigin: z.string().default('*'),

  // Metrics
  metricsEnabled: z.coerce.boolean().default(true),
  metricsPrefix: z.string().default('query_engine_'),
})

type Config = z.infer<typeof configSchema>

const parseConfig = (): Config => {
  try {
    return configSchema.parse({
      // Server
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL,

      // Auth Service
      authServiceUrl: process.env.AUTH_SERVICE_URL,
      authServiceTimeout: process.env.AUTH_SERVICE_TIMEOUT,

      // Redis
      redisUrl: process.env.REDIS_URL,
      cacheDefaultTtl: process.env.CACHE_DEFAULT_TTL,
      cacheMaxMemory: process.env.CACHE_MAX_MEMORY,

      // Rate Limiting
      rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,

      // Query Processing
      queryTimeout: process.env.QUERY_TIMEOUT,
      maxQueryLength: process.env.MAX_QUERY_LENGTH,
      maxResultRows: process.env.MAX_RESULT_ROWS,

      // Connection Limits
      maxConnectionsPerSource: process.env.MAX_CONNECTIONS_PER_SOURCE,
      connectionTimeout: process.env.CONNECTION_TIMEOUT,

      // Databricks
      databricksServerHostname: process.env.DATABRICKS_SERVER_HOSTNAME,
      databricksHttpPath: process.env.DATABRICKS_HTTP_PATH,
      databricksAccessToken: process.env.DATABRICKS_ACCESS_TOKEN,

      // BigQuery
      bigqueryProjectId: process.env.BIGQUERY_PROJECT_ID,
      bigqueryKeyFile: process.env.BIGQUERY_KEY_FILE,

      // Snowflake
      snowflakeAccount: process.env.SNOWFLAKE_ACCOUNT,
      snowflakeUsername: process.env.SNOWFLAKE_USERNAME,
      snowflakePassword: process.env.SNOWFLAKE_PASSWORD,
      snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
      snowflakeWarehouse: process.env.SNOWFLAKE_WAREHOUSE,

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