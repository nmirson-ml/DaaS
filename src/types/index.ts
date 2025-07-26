// Core type definitions for the Query Engine service

export interface QueryRequest {
  tenantId: string
  connectionId: string
  sql: string
  parameters?: Record<string, any>
  cacheKey?: string
  ttl?: number
  timeout?: number
}

export interface QueryResult {
  data: any[]
  columns: ColumnDefinition[]
  executionTime: number
  totalRows: number
  cached: boolean
  cacheKey?: string
  queryHash?: string
}

export interface ColumnDefinition {
  name: string
  type: string
  nullable?: boolean
  description?: string
}

export interface ConnectionConfig {
  id: string
  tenantId: string
  name: string
  type: 'databricks' | 'bigquery' | 'snowflake' | 'postgres'
  config: DatabricksConfig | BigQueryConfig | SnowflakeConfig | PostgresConfig
  status: 'active' | 'inactive' | 'error'
  lastTested?: Date
}

export interface DatabricksConfig {
  hostname: string
  httpPath: string
  accessToken: string
  warehouse?: string
  catalog?: string
  schema?: string
  connectionTimeout?: number
  queryTimeout?: number
}

export interface BigQueryConfig {
  projectId: string
  keyFile: string
  dataset?: string
}

export interface SnowflakeConfig {
  account: string
  username: string
  password: string
  warehouse?: string
  database?: string
  schema?: string
}

export interface PostgresConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
}

export interface SchemaInfo {
  database?: string
  schema?: string
  tables: TableInfo[]
}

export interface TableInfo {
  name: string
  schema?: string
  columns: ColumnDefinition[]
  type: 'table' | 'view'
  description?: string
  rowCount?: number
}

export interface CacheConfig {
  ttl: number
  maxSize?: number
  enableCompression?: boolean
}

export interface QueryMetrics {
  queryId: string
  tenantId: string
  connectionId: string
  sql: string
  executionTime: number
  rowsReturned: number
  cached: boolean
  timestamp: Date
  error?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  securityIssues: string[]
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  responseTime?: number
  error?: string
  timestamp: Date
}

export interface JWTPayload {
  sub: string // user ID
  tenant_id: string
  email: string
  permissions: string[]
  iat: number
  exp: number
}

export interface ServiceError extends Error {
  statusCode: number
  errorCode: string
  context?: Record<string, any>
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
  onError?: (error: Error) => void
}

export interface PerformanceMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  cacheHitRate: number
  activeConnections: number
}

export interface EmbedPermissions {
  canExecuteQueries: boolean
  canAccessSchema: boolean
  allowedTables?: string[]
  maxRowsPerQuery?: number
  maxQueriesPerHour?: number
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: Date
  services: {
    redis: boolean
    databricks: boolean
    database: boolean
  }
  metrics: {
    uptime: number
    memoryUsage: number
    cpuUsage: number
  }
}

// Zod schemas for validation
export { QueryRequestSchema, ConnectionConfigSchema, ValidationSchemas } from './schemas'