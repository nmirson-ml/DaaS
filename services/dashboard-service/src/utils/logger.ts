import { config } from '../config'

// Simple logger implementation
interface LogContext {
  [key: string]: any
}

class Logger {
  private logLevel: string

  constructor() {
    this.logLevel = config.logLevel
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug']
    const currentLevel = levels.indexOf(this.logLevel)
    const messageLevel = levels.indexOf(level)
    return messageLevel <= currentLevel
  }

  private formatMessage(level: string, context: LogContext | string, message?: string): string {
    const timestamp = new Date().toISOString()
    const service = 'dashboard-service'
    
    if (typeof context === 'string') {
      return `${timestamp} [${level.toUpperCase()}] [${service}] ${context}`
    }
    
    const msg = message || 'Log message'
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : ''
    return `${timestamp} [${level.toUpperCase()}] [${service}] ${msg} ${contextStr}`
  }

  error(context: LogContext | string, message?: string): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', context, message))
    }
  }

  warn(context: LogContext | string, message?: string): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', context, message))
    }
  }

  info(context: LogContext | string, message?: string): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', context, message))
    }
  }

  debug(context: LogContext | string, message?: string): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', context, message))
    }
  }
}

export const logger = new Logger() 