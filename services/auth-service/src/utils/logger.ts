import { config } from '@/config'

export interface LogContext {
  userId?: string
  tenantId?: string
  requestId?: string
  correlationId?: string
  [key: string]: any
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const logObject = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: 'auth-service',
      ...context,
    }

    if (config.nodeEnv === 'development') {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${
        context ? ` | ${JSON.stringify(context)}` : ''
      }`
    }

    return JSON.stringify(logObject)
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context))
  }

  warn(message: string, context?: LogContext): void {
    if (['error', 'warn', 'info', 'debug'].includes(config.logLevel)) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (['info', 'debug'].includes(config.logLevel)) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  debug(message: string, context?: LogContext): void {
    if (config.logLevel === 'debug') {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  // Security-specific logging
  security(eventType: string, message: string, context?: LogContext): void {
    const securityContext = {
      ...context,
      eventType,
      security: true,
    }
    console.warn(this.formatMessage('security', message, securityContext))
  }
}

export const logger = new Logger()