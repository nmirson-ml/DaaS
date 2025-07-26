import type { DataSource, QueryRequest, QueryResult } from '@platform/shared-types'

export interface ConnectionConfig {
  id?: string
  type: 'databricks' | 'bigquery' | 'snowflake' | 'postgresql' | 'mysql' | 'duckdb'
  tenantId?: string
  name?: string
  description?: string
}

export interface QueryExecutionContext {
  tenantId?: string
  userId?: string
  dataSourceId?: string
  timeout?: number
  maxRows?: number
  parameters?: Record<string, any>
}

export interface QueryMetrics {
  executionTime: number
  rowsReturned: number
  dataScanned: number
  cacheHit: boolean
}

export interface ColumnMetadata {
  name: string
  type: string
  nullable: boolean
  description?: string
}

export abstract class BaseConnector {
  protected config: ConnectionConfig

  constructor(config?: ConnectionConfig) {
    this.config = config || { type: 'databricks' }
  }

  abstract connect(): Promise<void>
  abstract testConnection(): Promise<boolean>
  
  abstract executeQuery(
    sql: string, 
    context: QueryExecutionContext
  ): Promise<{ rows: any[], columns: ColumnMetadata[], metrics: QueryMetrics }>
  
  abstract getSchema(): Promise<{
    databases: Array<{
      name: string
      tables: Array<{
        name: string
        columns: ColumnMetadata[]
      }>
    }>
  }>
  
  abstract validateQuery(sql: string): Promise<{ isValid: boolean; error?: string }>
  abstract close(): Promise<void>
  
  abstract getHealth(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: Record<string, any>
  }>

  getType(): string {
    return this.config.type
  }

  getConfig(): ConnectionConfig {
    return this.config
  }
} 