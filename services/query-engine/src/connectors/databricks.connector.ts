import { DBSQLClient } from '@databricks/sql'
import { BaseConnector, ConnectionConfig, QueryExecutionContext } from './base.connector'
import { logger } from '../utils/logger'
import type { QueryRequest, QueryResult } from '@platform/shared-types'

interface DatabricksConfig {
  serverHostname: string
  httpPath: string
  accessToken: string
  schema?: string
  catalog?: string
}

export class DatabricksConnector extends BaseConnector {
  private client: DBSQLClient | null = null
  private lastHealthCheck: Date = new Date()

  constructor(config: ConnectionConfig) {
    super(config)
  }

  /**
   * Initialize Databricks client
   */
  private async initializeClient(): Promise<DBSQLClient> {
    if (this.client) {
      return this.client
    }

    const databricksConfig = this.config.config as DatabricksConfig

    try {
      this.client = new DBSQLClient({
        serverHostname: databricksConfig.serverHostname,
        httpPath: databricksConfig.httpPath,
        accessToken: databricksConfig.accessToken,
      })

      await this.client.connect()
      logger.info({ 
        tenantId: this.config.tenantId,
        dataSourceId: this.config.id 
      }, 'Databricks client connected')

      return this.client
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        tenantId: this.config.tenantId,
        dataSourceId: this.config.id
      }, 'Failed to initialize Databricks client')
      throw error
    }
  }

  /**
   * Test connection to Databricks
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.initializeClient()
      const session = await client.openSession()
      
      // Execute simple test query
      const operation = await session.executeStatement('SELECT 1 as test', {
        runAsync: false,
      })
      
      const result = await operation.fetchAll()
      await operation.close()
      await session.close()

      return result.length > 0
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        tenantId: this.config.tenantId,
        dataSourceId: this.config.id
      }, 'Databricks connection test failed')
      return false
    }
  }

  /**
   * Execute query against Databricks
   */
  async executeQuery(
    request: QueryRequest,
    context: QueryExecutionContext
  ): Promise<QueryResult> {
    const startTime = Date.now()
    
    try {
      const client = await this.initializeClient()
      const session = await client.openSession()

      logger.info({
        tenantId: context.tenantId,
        dataSourceId: context.dataSourceId,
        sql: request.sql.substring(0, 200) + '...'
      }, 'Executing Databricks query')

      // Execute the query
      const operation = await session.executeStatement(request.sql, {
        runAsync: true,
        maxRows: context.maxRows || 10000,
      })

      // Fetch results
      const rows = await operation.fetchAll()
      const schema = await operation.getSchema()
      
      await operation.close()
      await session.close()

      const executionTime = Date.now() - startTime

      // Transform results to our format
      const columns = schema.map(col => ({
        name: col.name,
        type: this.mapDatabricksType(col.type),
      }))

      const data = rows.map(row => {
        const rowData: Record<string, any> = {}
        columns.forEach((col, index) => {
          rowData[col.name] = row[index]
        })
        return rowData
      })

      logger.info({
        tenantId: context.tenantId,
        dataSourceId: context.dataSourceId,
        executionTime,
        rowCount: data.length
      }, 'Databricks query completed')

      return {
        columns,
        data,
        rowCount: data.length,
        executionTimeMs: executionTime,
        cached: false,
        metadata: {
          dataSource: 'databricks',
          query: request.sql,
          parameters: request.parameters,
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      
      logger.error({
        error: (error as Error).message,
        tenantId: context.tenantId,
        dataSourceId: context.dataSourceId,
        sql: request.sql,
        executionTime
      }, 'Databricks query failed')

      throw new Error(`Databricks query failed: ${(error as Error).message}`)
    }
  }

  /**
   * Get schema information from Databricks
   */
  async getSchema(context: QueryExecutionContext): Promise<{
    databases: Array<{
      name: string
      tables: Array<{
        name: string
        columns: Array<{
          name: string
          type: string
          nullable: boolean
        }>
      }>
    }>
  }> {
    try {
      const client = await this.initializeClient()
      const session = await client.openSession()

      // Get databases/schemas
      const databasesQuery = 'SHOW DATABASES'
      const databasesOp = await session.executeStatement(databasesQuery, { runAsync: false })
      const databaseRows = await databasesOp.fetchAll()
      await databasesOp.close()

      const databases = []

      for (const dbRow of databaseRows) {
        const databaseName = dbRow[0] as string
        
        // Get tables for this database
        const tablesQuery = `SHOW TABLES IN ${databaseName}`
        const tablesOp = await session.executeStatement(tablesQuery, { runAsync: false })
        const tableRows = await tablesOp.fetchAll()
        await tablesOp.close()

        const tables = []

        for (const tableRow of tableRows) {
          const tableName = tableRow[1] as string // table name is in second column
          
          // Get columns for this table
          const columnsQuery = `DESCRIBE ${databaseName}.${tableName}`
          const columnsOp = await session.executeStatement(columnsQuery, { runAsync: false })
          const columnRows = await columnsOp.fetchAll()
          await columnsOp.close()

          const columns = columnRows.map(colRow => ({
            name: colRow[0] as string,
            type: this.mapDatabricksType(colRow[1] as string),
            nullable: !(colRow[2] as string).includes('NOT NULL'),
          }))

          tables.push({
            name: tableName,
            columns,
          })
        }

        databases.push({
          name: databaseName,
          tables,
        })
      }

      await session.close()
      return { databases }
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        tenantId: context.tenantId,
        dataSourceId: context.dataSourceId
      }, 'Failed to get Databricks schema')
      
      throw new Error(`Failed to get schema: ${(error as Error).message}`)
    }
  }

  /**
   * Validate SQL query syntax
   */
  async validateQuery(sql: string): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    try {
      const client = await this.initializeClient()
      const session = await client.openSession()
      
      // Use EXPLAIN to validate syntax without executing
      const explainQuery = `EXPLAIN ${sql}`
      const operation = await session.executeStatement(explainQuery, {
        runAsync: false,
      })
      
      await operation.fetchAll()
      await operation.close()
      await session.close()

      return { isValid: true, errors: [] }
    } catch (error) {
      return { 
        isValid: false, 
        errors: [(error as Error).message] 
      }
    }
  }

  /**
   * Get connection health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    lastChecked: Date
    details?: Record<string, any>
  }> {
    this.lastHealthCheck = new Date()

    try {
      const isHealthy = await this.testConnection()
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastChecked: this.lastHealthCheck,
        details: {
          clientConnected: !!this.client,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        lastChecked: this.lastHealthCheck,
        details: {
          error: (error as Error).message,
          clientConnected: !!this.client,
        },
      }
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close()
        this.client = null
        logger.info({ 
          tenantId: this.config.tenantId,
          dataSourceId: this.config.id 
        }, 'Databricks client closed')
      } catch (error) {
        logger.error({
          error: (error as Error).message,
          tenantId: this.config.tenantId,
          dataSourceId: this.config.id
        }, 'Error closing Databricks client')
      }
    }
  }

  /**
   * Map Databricks data types to our standard types
   */
  private mapDatabricksType(databricksType: string): string {
    const type = databricksType.toLowerCase()
    
    if (type.includes('int') || type.includes('bigint') || type.includes('smallint')) {
      return 'integer'
    }
    if (type.includes('decimal') || type.includes('double') || type.includes('float')) {
      return 'number'
    }
    if (type.includes('string') || type.includes('varchar') || type.includes('char')) {
      return 'string'
    }
    if (type.includes('boolean')) {
      return 'boolean'
    }
    if (type.includes('timestamp') || type.includes('date')) {
      return 'datetime'
    }
    if (type.includes('array')) {
      return 'array'
    }
    if (type.includes('struct') || type.includes('map')) {
      return 'object'
    }
    
    return 'string' // default fallback
  }
} 