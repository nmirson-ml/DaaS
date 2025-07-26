/**
 * Analytics Platform Embedding SDK
 * 
 * This SDK allows you to embed analytics dashboards into any web application
 * with full customization and security features.
 */

export interface EmbeddingConfig {
  // Required
  baseUrl: string
  token: string
  dashboardId: string
  container: string | HTMLElement

  // Optional customization
  theme?: Partial<ThemeConfig>
  filters?: Record<string, any>
  locale?: string
  timezone?: string
  
  // Interaction settings
  interactionMode?: 'view' | 'interact' | 'edit'
  allowDownload?: boolean
  allowShare?: boolean
  allowFullscreen?: boolean
  
  // Security
  allowedDomains?: string[]
  
  // Layout
  responsive?: boolean
  width?: number | string
  height?: number | string
  
  // Events
  onLoad?: () => void
  onError?: (error: Error) => void
  onFilterChange?: (filters: Record<string, any>) => void
  onDataRefresh?: () => void
}

export interface ThemeConfig {
  primaryColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  fontFamily: string
  borderRadius: number
  shadows: boolean
}

export interface DashboardApi {
  // Data operations
  refresh(): Promise<void>
  exportToPDF(): Promise<Blob>
  exportToImage(format: 'png' | 'svg'): Promise<Blob>
  
  // Filter operations
  setFilters(filters: Record<string, any>): Promise<void>
  getFilters(): Record<string, any>
  clearFilters(): Promise<void>
  
  // Theme operations
  setTheme(theme: Partial<ThemeConfig>): void
  getTheme(): ThemeConfig
  
  // Layout operations
  resize(width?: number, height?: number): void
  toggleFullscreen(): void
  
  // Event operations
  on(event: string, handler: Function): void
  off(event: string, handler?: Function): void
  
  // Cleanup
  destroy(): void
}

class EmbeddedDashboard implements DashboardApi {
  private config: EmbeddingConfig
  private iframe: HTMLIFrameElement | null = null
  private container: HTMLElement
  private eventHandlers: Map<string, Set<Function>> = new Map()
  private isDestroyed = false
  private messageId = 0

  constructor(config: EmbeddingConfig) {
    this.config = this.validateConfig(config)
    this.container = this.resolveContainer(config.container)
    this.initialize()
  }

  private validateConfig(config: EmbeddingConfig): EmbeddingConfig {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required')
    }
    if (!config.token) {
      throw new Error('token is required')
    }
    if (!config.dashboardId) {
      throw new Error('dashboardId is required')
    }
    if (!config.container) {
      throw new Error('container is required')
    }

    // Validate base URL
    try {
      new URL(config.baseUrl)
    } catch {
      throw new Error('Invalid baseUrl provided')
    }

    return {
      interactionMode: 'view',
      responsive: true,
      allowDownload: true,
      allowShare: true,
      allowFullscreen: true,
      locale: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...config,
    }
  }

  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === 'string') {
      const element = document.querySelector(container) as HTMLElement
      if (!element) {
        throw new Error(`Container element not found: ${container}`)
      }
      return element
    }
    return container
  }

  private initialize(): void {
    this.createIframe()
    this.setupMessageHandling()
    this.setupResizeObserver()
  }

  private createIframe(): void {
    const iframe = document.createElement('iframe')
    
    // Build embed URL with parameters
    const embedUrl = new URL(`${this.config.baseUrl}/embed/${this.config.dashboardId}`)
    embedUrl.searchParams.set('token', this.config.token)
    embedUrl.searchParams.set('mode', this.config.interactionMode!)
    
    if (this.config.theme) {
      embedUrl.searchParams.set('theme', JSON.stringify(this.config.theme))
    }
    if (this.config.filters) {
      embedUrl.searchParams.set('filters', JSON.stringify(this.config.filters))
    }
    if (this.config.locale) {
      embedUrl.searchParams.set('locale', this.config.locale)
    }
    if (this.config.timezone) {
      embedUrl.searchParams.set('timezone', this.config.timezone)
    }

    // Configure iframe
    iframe.src = embedUrl.toString()
    iframe.style.cssText = `
      border: none;
      width: 100%;
      height: 100%;
      display: block;
    `
    
    if (this.config.width) {
      iframe.style.width = typeof this.config.width === 'number' ? 
        `${this.config.width}px` : this.config.width
    }
    if (this.config.height) {
      iframe.style.height = typeof this.config.height === 'number' ? 
        `${this.config.height}px` : this.config.height
    }

    // Security attributes
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-downloads')
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
    
    this.iframe = iframe
    this.container.appendChild(iframe)
  }

  private setupMessageHandling(): void {
    window.addEventListener('message', this.handleMessage.bind(this))
  }

  private handleMessage(event: MessageEvent): void {
    // Verify origin
    try {
      const baseUrl = new URL(this.config.baseUrl)
      if (event.origin !== baseUrl.origin) {
        return
      }
    } catch {
      return
    }

    const { type, data, id } = event.data

    switch (type) {
      case 'dashboard:loaded':
        this.emit('load')
        if (this.config.onLoad) {
          this.config.onLoad()
        }
        break

      case 'dashboard:error':
        const error = new Error(data.message || 'Dashboard error')
        this.emit('error', error)
        if (this.config.onError) {
          this.config.onError(error)
        }
        break

      case 'dashboard:filter-change':
        this.emit('filterChange', data.filters)
        if (this.config.onFilterChange) {
          this.config.onFilterChange(data.filters)
        }
        break

      case 'dashboard:data-refresh':
        this.emit('dataRefresh')
        if (this.config.onDataRefresh) {
          this.config.onDataRefresh()
        }
        break
    }
  }

  private setupResizeObserver(): void {
    if (!this.config.responsive) return

    const resizeObserver = new ResizeObserver(() => {
      this.resize()
    })
    resizeObserver.observe(this.container)
  }

  private postMessage(type: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.iframe) {
        reject(new Error('Dashboard not initialized'))
        return
      }

      const id = ++this.messageId
      const message = { type, data, id }

      // Listen for response
      const handleResponse = (event: MessageEvent) => {
        if (event.data.id === id) {
          window.removeEventListener('message', handleResponse)
          if (event.data.error) {
            reject(new Error(event.data.error))
          } else {
            resolve(event.data.data)
          }
        }
      }

      window.addEventListener('message', handleResponse)
      
      // Timeout after 10 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleResponse)
        reject(new Error('Message timeout'))
      }, 10000)

      this.iframe.contentWindow?.postMessage(message, this.config.baseUrl)
    })
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error('Error in event handler:', error)
        }
      })
    }
  }

  // Public API methods
  async refresh(): Promise<void> {
    await this.postMessage('dashboard:refresh')
  }

  async exportToPDF(): Promise<Blob> {
    const data = await this.postMessage('dashboard:export', { format: 'pdf' })
    return new Blob([data], { type: 'application/pdf' })
  }

  async exportToImage(format: 'png' | 'svg' = 'png'): Promise<Blob> {
    const data = await this.postMessage('dashboard:export', { format })
    const mimeType = format === 'svg' ? 'image/svg+xml' : 'image/png'
    return new Blob([data], { type: mimeType })
  }

  async setFilters(filters: Record<string, any>): Promise<void> {
    await this.postMessage('dashboard:set-filters', { filters })
  }

  getFilters(): Record<string, any> {
    return this.config.filters || {}
  }

  async clearFilters(): Promise<void> {
    await this.postMessage('dashboard:clear-filters')
  }

  setTheme(theme: Partial<ThemeConfig>): void {
    this.config.theme = { ...this.config.theme, ...theme }
    this.postMessage('dashboard:set-theme', { theme: this.config.theme })
  }

  getTheme(): ThemeConfig {
    return this.config.theme as ThemeConfig
  }

  resize(width?: number, height?: number): void {
    if (!this.iframe) return

    if (width) {
      this.iframe.style.width = `${width}px`
    }
    if (height) {
      this.iframe.style.height = `${height}px`
    }

    this.postMessage('dashboard:resize', { width, height })
  }

  toggleFullscreen(): void {
    this.postMessage('dashboard:toggle-fullscreen')
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: string, handler?: Function): void {
    if (!this.eventHandlers.has(event)) return

    const handlers = this.eventHandlers.get(event)!
    if (handler) {
      handlers.delete(handler)
    } else {
      handlers.clear()
    }
  }

  destroy(): void {
    if (this.isDestroyed) return

    if (this.iframe) {
      this.iframe.remove()
      this.iframe = null
    }

    this.eventHandlers.clear()
    this.isDestroyed = true
  }
}

/**
 * Create and embed a dashboard
 */
export function createDashboard(config: EmbeddingConfig): DashboardApi {
  return new EmbeddedDashboard(config)
}

/**
 * Default theme configuration
 */
export const defaultTheme: ThemeConfig = {
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  borderColor: '#e5e7eb',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  borderRadius: 8,
  shadows: true,
}

/**
 * Validate token format
 */
export function validateToken(token: string): boolean {
  // Basic JWT format check
  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

/**
 * Get SDK version
 */
export const version = '1.0.0'

// Export types for TypeScript users
export type { EmbeddingConfig, ThemeConfig, DashboardApi } 