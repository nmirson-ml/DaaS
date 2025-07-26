import { PrismaClient } from '@/generated/prisma'
import { config } from '@/config'
import { logger } from '@/utils/logger'
import { DatabaseError } from '@/utils/errors'

export class DatabaseService {
  private static instance: DatabaseService
  private prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient({
      log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
    })

    // Add query logging middleware
    this.prisma.$use(async (params, next) => {
      const before = Date.now()
      const result = await next(params)
      const after = Date.now()

      logger.debug('Database query executed', {
        model: params.model,
        action: params.action,
        duration: `${after - before}ms`,
      })

      return result
    })

    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      await this.disconnect()
    })
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  get client(): PrismaClient {
    return this.prisma
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect()
      logger.info('Database connected successfully')
    } catch (error) {
      logger.error('Failed to connect to database', { error: error.message })
      throw new DatabaseError('Database connection failed')
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      logger.info('Database disconnected successfully')
    } catch (error) {
      logger.error('Failed to disconnect from database', { error: error.message })
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }> {
    const start = Date.now()
    
    try {
      await this.prisma.$queryRaw`SELECT 1`
      const latency = Date.now() - start
      
      return {
        status: 'healthy',
        latency,
      }
    } catch (error) {
      logger.error('Database health check failed', { error: error.message })
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
      }
    }
  }

  /**
   * Execute database operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error
        }

        if (attempt < maxRetries) {
          logger.warn(`Database operation failed, retrying in ${delay}ms`, {
            attempt,
            maxRetries,
            error: error.message,
          })
          
          await this.sleep(delay * attempt) // Exponential backoff
        }
      }
    }

    logger.error('Database operation failed after all retries', {
      maxRetries,
      error: lastError.message,
    })
    
    throw lastError
  }

  /**
   * Execute transaction with automatic retry
   */
  async transaction<T>(
    operations: (prisma: PrismaClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    return this.withRetry(
      () => this.prisma.$transaction(operations),
      maxRetries
    )
  }

  private isNonRetryableError(error: any): boolean {
    // Prisma error codes that shouldn't be retried
    const nonRetryableCodes = [
      'P2002', // Unique constraint violation
      'P2003', // Foreign key constraint violation
      'P2004', // Constraint violation
      'P2025', // Record not found
    ]

    return nonRetryableCodes.includes(error.code)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance()