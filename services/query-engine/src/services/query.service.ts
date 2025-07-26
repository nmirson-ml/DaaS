import { CacheService } from './cache.service'
import { logger } from '../utils/logger'
import { config } from '../config'
import { BaseConnector } from '../connectors/base.connector'
import { DatabricksConnector } from '../connectors/databricks.connector'
import { DuckDBConnector } from '../connectors/duckdb.connector'
import type { QueryRequest, QueryResult } from '@platform/shared-types'

export class QueryService {
  private connectors = new Map<string, BaseConnector>()
  private cache: CacheService

  constructor() {
    this.cache = new CacheService()
  }

  /**
   * Register a data source connection
   */
  async registerDataSource(id: string, config: any): Promise<void> {
    try {
      let connector: BaseConnector

      switch (config.type) {
        case 'databricks':
          connector = new DatabricksConnector(config)
          break
        case 'duckdb':
          connector = new DuckDBConnector(config)
          break
        case 'bigquery':
          // TODO: Implement BigQuery connector
          throw new Error('BigQuery connector not yet implemented')
        case 'snowflake':
          // TODO: Implement Snowflake connector
          throw new Error('Snowflake connector not yet implemented')
        case 'postgresql':
          // TODO: Implement PostgreSQL connector
          throw new Error('PostgreSQL connector not yet implemented')
        case 'mysql':
          // TODO: Implement MySQL connector
          throw new Error('MySQL connector not yet implemented')
        default:
          throw new Error(`Unsupported data source type: ${config.type}`)
      }

      await connector.connect()
      this.connectors.set(id, connector)

      logger.info({
        dataSourceId: id,
        type: config.type
      }, 'Data source registered successfully')

    } catch (error) {
      logger.error({
        dataSourceId: id,
        error: (error as Error).message
      }, 'Failed to register data source')
      throw error
    }
  }

  /**
   * Remove a data source connection
   */
  async removeDataSource(id: string): Promise<void> {
    const connector = this.connectors.get(id)
    if (connector) {
      await connector.close()
      this.connectors.delete(id)
      
      logger.info({
        dataSourceId: id
      }, 'Data source removed')
    }
  }

  /**
   * Execute query against a data source
   */
  async executeQuery(request: QueryRequest): Promise<QueryResult> {
    const startTime = Date.now()
    
    try {
      // Validate request
      if (!request.dataSourceId || !request.sql) {
        throw new Error('Missing required fields: dataSourceId and sql')
      }

      // Get connector
      const connector = this.connectors.get(request.dataSourceId)
      if (!connector) {
        throw new Error(`Data source not found: ${request.dataSourceId}`)
      }

      // Check cache if enabled
      let cacheKey: string | undefined
      if (request.useCache !== false) {
        cacheKey = this.cache.generateCacheKey(
          request.dataSourceId,
          request.sql,
          request.parameters || {}
        )

        const cachedResult = await this.cache.get(cacheKey)
        if (cachedResult) {
          logger.info({
            dataSourceId: request.dataSourceId,
            cacheKey,
            executionTime: Date.now() - startTime
          }, 'Query result served from cache')

          return {
            ...cachedResult,
            metadata: {
              ...cachedResult.metadata,
              cached: true,
              executionTime: Date.now() - startTime
            }
          }
        }
      }

      // Basic SQL injection prevention
      this.validateSQL(request.sql)

      // Execute query
      const result = await connector.executeQuery(request.sql, {
        parameters: request.parameters || {},
        timeout: request.timeout || config.queryTimeout,
        maxRows: request.maxRows || config.maxRowsPerQuery
      })

      // Prepare response
      const queryResult: QueryResult = {
        columns: result.columns,
        rows: result.rows,
        metadata: {
          executionTime: result.metrics.executionTime,
          rowCount: result.metrics.rowsReturned,
          dataScanned: result.metrics.dataScanned,
          cached: false
        }
      }

      // Cache result if applicable
      if (cacheKey && request.useCache !== false) {
        const ttl = request.cacheTtl || config.defaultCacheTtl
        await this.cache.set(cacheKey, queryResult, ttl)
      }

      logger.info({
        dataSourceId: request.dataSourceId,
        executionTime: result.metrics.executionTime,
        rowCount: result.metrics.rowsReturned,
        cached: false
      }, 'Query executed successfully')

      return queryResult

    } catch (error) {
      logger.error({
        dataSourceId: request.dataSourceId,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      }, 'Query execution failed')
      throw error
    }
  }

  /**
   * Get schema for a data source
   */
  async getSchema(dataSourceId: string): Promise<any> {
    const connector = this.connectors.get(dataSourceId)
    if (!connector) {
      throw new Error(`Data source not found: ${dataSourceId}`)
    }

    return await connector.getSchema()
  }

  /**
   * Validate SQL query
   */
  async validateQuery(dataSourceId: string, sql: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Basic validation
      this.validateSQL(sql)

      // Connector-specific validation
      const connector = this.connectors.get(dataSourceId)
      if (!connector) {
        return { isValid: false, error: `Data source not found: ${dataSourceId}` }
      }

      return await connector.validateQuery(sql)
    } catch (error) {
      return {
        isValid: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Get health status of all data sources
   */
  async getHealthStatus(): Promise<Record<string, any>> {
    const healthStatus: Record<string, any> = {}

    for (const [id, connector] of this.connectors.entries()) {
      try {
        healthStatus[id] = await connector.getHealth()
      } catch (error) {
        healthStatus[id] = {
          status: 'unhealthy',
          error: (error as Error).message
        }
      }
    }

    return healthStatus
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    return await this.cache.getStats()
  }

  /**
   * Clear cache for a data source
   */
  async clearCache(dataSourceId: string): Promise<void> {
    await this.cache.invalidateByPattern(`${dataSourceId}:*`)
    logger.info({
      dataSourceId
    }, 'Cache cleared for data source')
  }

  /**
   * Get connector for direct access (for special operations like loading data)
   */
  getConnector(dataSourceId: string): BaseConnector | undefined {
    return this.connectors.get(dataSourceId)
  }

  /**
   * Basic SQL injection prevention
   */
  private validateSQL(sql: string): void {
    const suspiciousPatterns = [
      /;\s*drop\s+/i,
      /;\s*delete\s+/i,
      /;\s*update\s+.*set/i,
      /;\s*insert\s+/i,
      /;\s*create\s+/i,
      /;\s*alter\s+/i,
      /;\s*truncate\s+/i,
      /--.*$/gm,
      /\/\*.*?\*\//gs
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sql)) {
        throw new Error('Potentially unsafe SQL detected')
      }
    }

    // Basic length check
    if (sql.length > config.maxQueryLength) {
      throw new Error(`Query too long. Maximum length: ${config.maxQueryLength}`)
    }
  }
} 