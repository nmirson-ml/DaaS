import Redis from 'ioredis'
import { config } from '../config'
import { logger } from '../utils/logger'
import type { QueryResult } from '@platform/shared-types'

export class CacheService {
  private redis: Redis
  private defaultTtl: number

  constructor() {
    this.redis = new Redis(config.redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
    this.defaultTtl = config.cacheDefaultTtl

    this.redis.on('error', (error) => {
      logger.error({ error: error.message }, 'Redis connection error')
    })

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully')
    })
  }

  /**
   * Generate cache key for query
   */
  generateCacheKey(tenantId: string, dataSourceId: string, sql: string, parameters?: Record<string, any>): string {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase()
    const parametersStr = parameters ? JSON.stringify(parameters) : ''
    const content = `${tenantId}:${dataSourceId}:${normalizedSql}:${parametersStr}`
    
    // Use a simple hash for the key
    return `query:${this.simpleHash(content)}`
  }

  /**
   * Get cached query result
   */
  async get(cacheKey: string): Promise<QueryResult | null> {
    try {
      const cached = await this.redis.get(cacheKey)
      if (!cached) {
        return null
      }

      const result = JSON.parse(cached) as QueryResult
      logger.debug({ cacheKey }, 'Cache hit')
      
      // Track cache hit metric
      await this.redis.incr('cache:hits')
      
      return result
    } catch (error) {
      logger.error({ error: error.message, cacheKey }, 'Cache get error')
      return null
    }
  }

  /**
   * Set cached query result
   */
  async set(cacheKey: string, result: QueryResult, ttl?: number): Promise<void> {
    try {
      const ttlSeconds = ttl || this.defaultTtl
      await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(result))
      
      logger.debug({ cacheKey, ttl: ttlSeconds }, 'Cache set')
      
      // Track cache set metric
      await this.redis.incr('cache:sets')
    } catch (error) {
      logger.error({ error: error.message, cacheKey }, 'Cache set error')
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) {
        return 0
      }

      const deleted = await this.redis.del(...keys)
      logger.info({ pattern, deleted }, 'Cache invalidated')
      
      return deleted
    } catch (error) {
      logger.error({ error: error.message, pattern }, 'Cache invalidation error')
      return 0
    }
  }

  /**
   * Invalidate tenant cache
   */
  async invalidateTenant(tenantId: string): Promise<number> {
    return this.invalidatePattern(`query:*${tenantId}*`)
  }

  /**
   * Invalidate data source cache
   */
  async invalidateDataSource(tenantId: string, dataSourceId: string): Promise<number> {
    return this.invalidatePattern(`query:*${tenantId}*${dataSourceId}*`)
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{ hits: number; sets: number; memory: string }> {
    try {
      const [hits, sets, memory] = await Promise.all([
        this.redis.get('cache:hits').then(v => parseInt(v || '0')),
        this.redis.get('cache:sets').then(v => parseInt(v || '0')),
        this.redis.memory('usage'),
      ])

      return {
        hits,
        sets,
        memory: `${Math.round(memory / 1024 / 1024)}MB`,
      }
    } catch (error) {
      logger.error({ error: error.message }, 'Cache stats error')
      return { hits: 0, sets: 0, memory: '0MB' }
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch (error) {
      logger.error({ error: error.message }, 'Cache health check failed')
      return false
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    await this.redis.quit()
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }
} 