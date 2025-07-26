import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

class DatabaseService {
  public client: PrismaClient
  private isConnected = false

  constructor() {
    this.client = new PrismaClient({
      log: ['query', 'error', 'info', 'warn'],
    })
  }

  async connect(): Promise<void> {
    try {
      await this.client.$connect()
      this.isConnected = true
      logger.info('Database connected successfully')
    } catch (error) {
      logger.error({
        error: (error as Error).message,
      }, 'Failed to connect to database')
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.$disconnect()
      this.isConnected = false
      logger.info('Database disconnected')
    } catch (error) {
      logger.error({
        error: (error as Error).message,
      }, 'Error disconnecting from database')
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error({
        error: (error as Error).message,
      }, 'Database health check failed')
      return false
    }
  }

  async transaction(fn: any): Promise<any> {
    return this.client.$transaction(fn)
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

export const db = new DatabaseService() 