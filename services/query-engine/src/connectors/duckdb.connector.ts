import { BaseConnector, ConnectionConfig, QueryExecutionContext, QueryMetrics, ColumnMetadata } from './base.connector'
import { Database } from 'duckdb'
import { logger } from '../utils/logger'
import * as path from 'path'
import * as fs from 'fs'

export interface DuckDBConnectionConfig extends ConnectionConfig {
  type: 'duckdb'
  databasePath?: string // Path to DuckDB file, :memory: for in-memory
  readOnly?: boolean
  extensions?: string[] // DuckDB extensions to load
  settings?: Record<string, any> // DuckDB settings
}

export class DuckDBConnector extends BaseConnector {
  private db: Database | null = null
  private connection: any = null
  private config: DuckDBConnectionConfig
  private isConnected = false

  constructor(config: DuckDBConnectionConfig) {
    super()
    this.config = {
      readOnly: false,
      extensions: [],
      settings: {},
      ...config
    }
  }

  async connect(): Promise<void> {
    try {
      const duckdb = await import('duckdb')
      
      // Create database instance
      const dbPath = this.config.databasePath || ':memory:'
      this.db = new duckdb.Database(dbPath)
      
      // Get connection
      this.connection = this.db.connect()
      
      // Load extensions if specified
      if (this.config.extensions && this.config.extensions.length > 0) {
        for (const extension of this.config.extensions) {
          await this.executeQuery(`INSTALL ${extension}`, {})
          await this.executeQuery(`LOAD ${extension}`, {})
        }
      }
      
      // Apply settings
      if (this.config.settings) {
        for (const [key, value] of Object.entries(this.config.settings)) {
          await this.executeQuery(`SET ${key} = '${value}'`, {})
        }
      }
      
      this.isConnected = true
      logger.info({
        databasePath: dbPath,
        extensions: this.config.extensions
      }, 'DuckDB connection established')
      
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        config: this.config
      }, 'Failed to connect to DuckDB')
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect()
      }
      
      const result = await this.executeQuery('SELECT 1 as test', {})
      return result.rows.length === 1 && result.rows[0].test === 1
    } catch (error) {
      logger.error({
        error: (error as Error).message
      }, 'DuckDB connection test failed')
      return false
    }
  }

  async executeQuery(
    sql: string, 
    context: QueryExecutionContext
  ): Promise<{ rows: any[], columns: ColumnMetadata[], metrics: QueryMetrics }> {
    const startTime = Date.now()
    
    try {
      if (!this.isConnected || !this.connection) {
        await this.connect()
      }

      logger.debug({
        sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
        context
      }, 'Executing DuckDB query')

      // Execute query with parameters
      const result = await new Promise<any>((resolve, reject) => {
        // Replace parameters in SQL (basic implementation)
        let finalSql = sql
        if (context.parameters) {
          for (const [key, value] of Object.entries(context.parameters)) {
            const placeholder = new RegExp(`\\$${key}\\b`, 'g')
            const escapedValue = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : String(value)
            finalSql = finalSql.replace(placeholder, escapedValue)
          }
        }

        this.connection.all(finalSql, (err: any, rows: any[]) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              rows: rows || [],
              columns: this.extractColumns(rows)
            })
          }
        })
      })

      const endTime = Date.now()
      const metrics: QueryMetrics = {
        executionTime: endTime - startTime,
        rowsReturned: result.rows.length,
        dataScanned: 0, // DuckDB doesn't provide this easily
        cacheHit: false
      }

      logger.info({
        executionTime: metrics.executionTime,
        rowsReturned: metrics.rowsReturned
      }, 'DuckDB query executed successfully')

      return {
        rows: result.rows,
        columns: result.columns,
        metrics
      }

    } catch (error) {
      const endTime = Date.now()
      logger.error({
        error: (error as Error).message,
        sql: sql.substring(0, 200),
        executionTime: endTime - startTime
      }, 'DuckDB query execution failed')
      throw error
    }
  }

  async getSchema(): Promise<{
    databases: Array<{
      name: string
      tables: Array<{
        name: string
        columns: ColumnMetadata[]
      }>
    }>
  }> {
    try {
      // Get all tables
      const tablesResult = await this.executeQuery(`
        SELECT table_name, table_schema 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_schema, table_name
      `, {})

      const databases: Array<{
        name: string
        tables: Array<{
          name: string
          columns: ColumnMetadata[]
        }>
      }> = []

      // Group tables by schema
      const schemaMap = new Map<string, any[]>()
      for (const row of tablesResult.rows) {
        const schema = row.table_schema || 'main'
        if (!schemaMap.has(schema)) {
          schemaMap.set(schema, [])
        }
        schemaMap.get(schema)!.push(row.table_name)
      }

      // Get columns for each table
      for (const [schemaName, tableNames] of schemaMap.entries()) {
        const tables: Array<{
          name: string
          columns: ColumnMetadata[]
        }> = []

        for (const tableName of tableNames) {
          const columnsResult = await this.executeQuery(`
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' 
            AND table_schema = '${schemaName}'
            ORDER BY ordinal_position
          `, {})

          const columns: ColumnMetadata[] = columnsResult.rows.map(row => ({
            name: row.column_name,
            type: this.mapDuckDBType(row.data_type),
            nullable: row.is_nullable === 'YES',
            description: `${row.data_type} column`
          }))

          tables.push({
            name: tableName,
            columns
          })
        }

        databases.push({
          name: schemaName,
          tables
        })
      }

      return { databases }

    } catch (error) {
      logger.error({
        error: (error as Error).message
      }, 'Failed to get DuckDB schema')
      throw error
    }
  }

  async validateQuery(sql: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Use EXPLAIN to validate query without executing
      await this.executeQuery(`EXPLAIN ${sql}`, {})
      return { isValid: true }
    } catch (error) {
      return {
        isValid: false,
        error: (error as Error).message
      }
    }
  }

  async close(): Promise<void> {
    try {
      if (this.connection) {
        this.connection.close()
        this.connection = null
      }
      if (this.db) {
        this.db.close()
        this.db = null
      }
      this.isConnected = false
      logger.info('DuckDB connection closed')
    } catch (error) {
      logger.error({
        error: (error as Error).message
      }, 'Error closing DuckDB connection')
    }
  }

  async getHealth(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: Record<string, any>
  }> {
    try {
      const isHealthy = await this.testConnection()
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          connected: this.isConnected,
          databasePath: this.config.databasePath || ':memory:',
          readOnly: this.config.readOnly
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message
        }
      }
    }
  }

  /**
   * Load CSV data into DuckDB
   */
  async loadCSV(tableName: string, csvPath: string, options: {
    delimiter?: string
    header?: boolean
    skipRows?: number
    columns?: Record<string, string> // column_name: data_type
  } = {}): Promise<void> {
    const {
      delimiter = ',',
      header = true,
      skipRows = 0
    } = options

    let sql = `
      CREATE TABLE ${tableName} AS 
      SELECT * FROM read_csv_auto('${csvPath}', 
        delim='${delimiter}', 
        header=${header}, 
        skip=${skipRows}
      )
    `

    await this.executeQuery(sql, {})
    logger.info({
      tableName,
      csvPath,
      options
    }, 'CSV data loaded into DuckDB')
  }

  /**
   * Load JSON data into DuckDB
   */
  async loadJSON(tableName: string, jsonPath: string): Promise<void> {
    const sql = `
      CREATE TABLE ${tableName} AS 
      SELECT * FROM read_json_auto('${jsonPath}')
    `

    await this.executeQuery(sql, {})
    logger.info({
      tableName,
      jsonPath
    }, 'JSON data loaded into DuckDB')
  }

  /**
   * Load Parquet data into DuckDB
   */
  async loadParquet(tableName: string, parquetPath: string): Promise<void> {
    const sql = `
      CREATE TABLE ${tableName} AS 
      SELECT * FROM read_parquet('${parquetPath}')
    `

    await this.executeQuery(sql, {})
    logger.info({
      tableName,
      parquetPath
    }, 'Parquet data loaded into DuckDB')
  }

  private extractColumns(rows: any[]): ColumnMetadata[] {
    if (!rows || rows.length === 0) {
      return []
    }

    const firstRow = rows[0]
    return Object.keys(firstRow).map(columnName => ({
      name: columnName,
      type: this.inferColumnType(firstRow[columnName]),
      nullable: true,
      description: `Inferred ${typeof firstRow[columnName]} column`
    }))
  }

  private inferColumnType(value: any): string {
    if (value === null || value === undefined) return 'string'
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'float'
    }
    if (typeof value === 'boolean') return 'boolean'
    if (value instanceof Date) return 'timestamp'
    return 'string'
  }

  private mapDuckDBType(duckdbType: string): string {
    const typeMap: Record<string, string> = {
      'INTEGER': 'integer',
      'BIGINT': 'integer', 
      'DOUBLE': 'float',
      'REAL': 'float',
      'DECIMAL': 'decimal',
      'VARCHAR': 'string',
      'TEXT': 'string',
      'BOOLEAN': 'boolean',
      'DATE': 'date',
      'TIME': 'time',
      'TIMESTAMP': 'timestamp',
      'TIMESTAMPTZ': 'timestamp',
      'JSON': 'json',
      'BLOB': 'binary'
    }

    const upperType = duckdbType.toUpperCase()
    for (const [duckType, standardType] of Object.entries(typeMap)) {
      if (upperType.includes(duckType)) {
        return standardType
      }
    }

    return 'string' // Default fallback
  }
} 