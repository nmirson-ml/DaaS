import { db } from './database.service'
import { logger } from '../utils/logger'
import { config } from '../config'
import { v4 as uuidv4 } from 'uuid'
import type { 
  Dashboard, 
  Widget, 
  CreateDashboardRequest,
  UpdateDashboardRequest,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  DashboardWithWidgets 
} from '@platform/shared-types'

export class DashboardService {

  /**
   * Create a new dashboard
   */
  async createDashboard(
    request: CreateDashboardRequest,
    context: { tenantId: string; userId: string }
  ): Promise<Dashboard> {
    try {
      // Check tenant dashboard limit
      const dashboardCount = await db.client.dashboard.count({
        where: { tenantId: context.tenantId }
      })

      if (dashboardCount >= config.maxDashboardsPerTenant) {
        throw new Error(`Dashboard limit reached. Maximum ${config.maxDashboardsPerTenant} dashboards per tenant.`)
      }

      const dashboard = await db.client.dashboard.create({
        data: {
          name: request.name,
          description: request.description,
          tenantId: context.tenantId,
          ownerId: context.userId,
          layout: request.layout || {},
          theme: request.theme || {},
          filters: request.filters || [],
          settings: request.settings || {},
          status: 'DRAFT',
        },
      })

      logger.info({
        dashboardId: dashboard.id,
        tenantId: context.tenantId,
        userId: context.userId,
        name: request.name
      }, 'Dashboard created')

      return this.transformDashboard(dashboard)
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        tenantId: context.tenantId,
        userId: context.userId,
        request
      }, 'Failed to create dashboard')
      throw error
    }
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(
    dashboardId: string,
    context: { tenantId: string; userId: string }
  ): Promise<DashboardWithWidgets> {
    try {
      const dashboard = await db.client.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId: context.tenantId,
        },
        include: {
          widgets: {
            orderBy: { order: 'asc' }
          },
          permissions: true,
        },
      })

      if (!dashboard) {
        throw new Error('Dashboard not found')
      }

      // Check permissions
      await this.checkDashboardAccess(dashboard, context.userId, 'read')

      return this.transformDashboardWithWidgets(dashboard)
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Failed to get dashboard')
      throw error
    }
  }

  /**
   * List dashboards for tenant
   */
  async listDashboards(
    context: { tenantId: string; userId: string },
    options: {
      page?: number
      limit?: number
      status?: string
      search?: string
    } = {}
  ): Promise<{
    dashboards: Dashboard[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const page = options.page || 1
      const limit = Math.min(options.limit || 20, 100)
      const offset = (page - 1) * limit

      const where: any = {
        tenantId: context.tenantId,
        OR: [
          { ownerId: context.userId },
          {
            permissions: {
              some: {
                userId: context.userId,
              },
            },
          },
          { isPublic: true },
        ],
      }

      if (options.status) {
        where.status = options.status.toUpperCase()
      }

      if (options.search) {
        where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ]
      }

      const [dashboards, total] = await Promise.all([
        db.client.dashboard.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        db.client.dashboard.count({ where }),
      ])

      return {
        dashboards: dashboards.map(d => this.transformDashboard(d)),
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        tenantId: context.tenantId,
        userId: context.userId,
        options
      }, 'Failed to list dashboards')
      throw error
    }
  }

  /**
   * Update dashboard
   */
  async updateDashboard(
    dashboardId: string,
    request: UpdateDashboardRequest,
    context: { tenantId: string; userId: string }
  ): Promise<Dashboard> {
    try {
      const dashboard = await db.client.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId: context.tenantId,
        },
        include: { permissions: true },
      })

      if (!dashboard) {
        throw new Error('Dashboard not found')
      }

      // Check permissions
      await this.checkDashboardAccess(dashboard, context.userId, 'write')

      const updatedDashboard = await db.client.dashboard.update({
        where: { id: dashboardId },
        data: {
          name: request.name,
          description: request.description,
          layout: request.layout,
          theme: request.theme,
          filters: request.filters,
          settings: request.settings,
          version: { increment: 1 },
        },
      })

      logger.info({
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId,
        changes: Object.keys(request)
      }, 'Dashboard updated')

      return this.transformDashboard(updatedDashboard)
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId,
        request
      }, 'Failed to update dashboard')
      throw error
    }
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(
    dashboardId: string,
    context: { tenantId: string; userId: string }
  ): Promise<void> {
    try {
      const dashboard = await db.client.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId: context.tenantId,
        },
        include: { permissions: true },
      })

      if (!dashboard) {
        throw new Error('Dashboard not found')
      }

      // Check permissions (owner or admin)
      await this.checkDashboardAccess(dashboard, context.userId, 'admin')

      await db.client.dashboard.delete({
        where: { id: dashboardId },
      })

      logger.info({
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Dashboard deleted')
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Failed to delete dashboard')
      throw error
    }
  }

  /**
   * Publish dashboard
   */
  async publishDashboard(
    dashboardId: string,
    context: { tenantId: string; userId: string }
  ): Promise<Dashboard> {
    try {
      const dashboard = await db.client.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId: context.tenantId,
        },
        include: { 
          permissions: true,
          widgets: true,
        },
      })

      if (!dashboard) {
        throw new Error('Dashboard not found')
      }

      // Check permissions
      await this.checkDashboardAccess(dashboard, context.userId, 'write')

      // Create version snapshot before publishing
      await this.createDashboardVersion(dashboard, context.userId)

      const updatedDashboard = await db.client.dashboard.update({
        where: { id: dashboardId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          version: { increment: 1 },
        },
      })

      logger.info({
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Dashboard published')

      return this.transformDashboard(updatedDashboard)
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Failed to publish dashboard')
      throw error
    }
  }

  /**
   * Create widget
   */
  async createWidget(
    dashboardId: string,
    request: CreateWidgetRequest,
    context: { tenantId: string; userId: string }
  ): Promise<Widget> {
    try {
      const dashboard = await db.client.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId: context.tenantId,
        },
        include: { 
          permissions: true,
          widgets: true,
        },
      })

      if (!dashboard) {
        throw new Error('Dashboard not found')
      }

      // Check permissions
      await this.checkDashboardAccess(dashboard, context.userId, 'write')

      // Check widget limit
      if (dashboard.widgets.length >= config.maxWidgetsPerDashboard) {
        throw new Error(`Widget limit reached. Maximum ${config.maxWidgetsPerDashboard} widgets per dashboard.`)
      }

      const widget = await db.client.widget.create({
        data: {
          dashboardId,
          name: request.name,
          description: request.description,
          type: request.type,
          config: request.config || {},
          query: request.query || {},
          position: request.position || {},
          style: request.style || {},
          dataSourceId: request.dataSourceId,
          order: dashboard.widgets.length,
        },
      })

      logger.info({
        widgetId: widget.id,
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId,
        type: request.type
      }, 'Widget created')

      return this.transformWidget(widget)
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId,
        request
      }, 'Failed to create widget')
      throw error
    }
  }

  /**
   * Update widget
   */
  async updateWidget(
    widgetId: string,
    request: UpdateWidgetRequest,
    context: { tenantId: string; userId: string }
  ): Promise<Widget> {
    try {
      const widget = await db.client.widget.findFirst({
        where: { id: widgetId },
        include: {
          dashboard: {
            include: { permissions: true }
          }
        }
      })

      if (!widget || widget.dashboard.tenantId !== context.tenantId) {
        throw new Error('Widget not found')
      }

      // Check permissions
      await this.checkDashboardAccess(widget.dashboard, context.userId, 'write')

      const updatedWidget = await db.client.widget.update({
        where: { id: widgetId },
        data: {
          name: request.name,
          description: request.description,
          config: request.config,
          query: request.query,
          position: request.position,
          style: request.style,
          dataSourceId: request.dataSourceId,
          isVisible: request.isVisible,
        },
      })

      logger.info({
        widgetId,
        dashboardId: widget.dashboardId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Widget updated')

      return this.transformWidget(updatedWidget)
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        widgetId,
        tenantId: context.tenantId,
        userId: context.userId,
        request
      }, 'Failed to update widget')
      throw error
    }
  }

  /**
   * Delete widget
   */
  async deleteWidget(
    widgetId: string,
    context: { tenantId: string; userId: string }
  ): Promise<void> {
    try {
      const widget = await db.client.widget.findFirst({
        where: { id: widgetId },
        include: {
          dashboard: {
            include: { permissions: true }
          }
        }
      })

      if (!widget || widget.dashboard.tenantId !== context.tenantId) {
        throw new Error('Widget not found')
      }

      // Check permissions
      await this.checkDashboardAccess(widget.dashboard, context.userId, 'write')

      await db.client.widget.delete({
        where: { id: widgetId },
      })

      logger.info({
        widgetId,
        dashboardId: widget.dashboardId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Widget deleted')
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        widgetId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Failed to delete widget')
      throw error
    }
  }

  /**
   * Generate share token for dashboard
   */
  async generateShareToken(
    dashboardId: string,
    context: { tenantId: string; userId: string }
  ): Promise<string> {
    try {
      const dashboard = await db.client.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId: context.tenantId,
        },
        include: { permissions: true },
      })

      if (!dashboard) {
        throw new Error('Dashboard not found')
      }

      // Check permissions
      await this.checkDashboardAccess(dashboard, context.userId, 'admin')

      const shareToken = uuidv4()

      await db.client.dashboard.update({
        where: { id: dashboardId },
        data: {
          shareToken,
          isPublic: true,
        },
      })

      logger.info({
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Share token generated')

      return shareToken
    } catch (error) {
      logger.error({
        error: (error as Error).message,
        dashboardId,
        tenantId: context.tenantId,
        userId: context.userId
      }, 'Failed to generate share token')
      throw error
    }
  }

  /**
   * Check dashboard access permissions
   */
  private async checkDashboardAccess(
    dashboard: any,
    userId: string,
    requiredPermission: 'read' | 'write' | 'admin'
  ): Promise<void> {
    // Owner has all permissions
    if (dashboard.ownerId === userId) {
      return
    }

    // Check public access for read
    if (requiredPermission === 'read' && dashboard.isPublic) {
      return
    }

    // Check explicit permissions
    const permission = dashboard.permissions?.find((p: any) => p.userId === userId)
    if (!permission) {
      throw new Error('Access denied')
    }

    const permissionLevel = permission.role
    const hasAccess = 
      (requiredPermission === 'read' && ['VIEWER', 'EDITOR', 'ADMIN'].includes(permissionLevel)) ||
      (requiredPermission === 'write' && ['EDITOR', 'ADMIN'].includes(permissionLevel)) ||
      (requiredPermission === 'admin' && permissionLevel === 'ADMIN')

    if (!hasAccess) {
      throw new Error('Insufficient permissions')
    }
  }

  /**
   * Create dashboard version snapshot
   */
  private async createDashboardVersion(dashboard: any, userId: string): Promise<void> {
    // Remove old versions if limit exceeded
    const versionCount = await db.client.dashboardVersion.count({
      where: { dashboardId: dashboard.id }
    })

    if (versionCount >= config.maxVersionsPerDashboard) {
      const oldestVersion = await db.client.dashboardVersion.findFirst({
        where: { dashboardId: dashboard.id },
        orderBy: { version: 'asc' }
      })

      if (oldestVersion) {
        await db.client.dashboardVersion.delete({
          where: { id: oldestVersion.id }
        })
      }
    }

    await db.client.dashboardVersion.create({
      data: {
        dashboardId: dashboard.id,
        version: dashboard.version,
        name: `Version ${dashboard.version}`,
        layout: dashboard.layout,
        theme: dashboard.theme,
        filters: dashboard.filters,
        settings: dashboard.settings,
        widgets: dashboard.widgets,
        createdBy: userId,
      }
    })
  }

  /**
   * Transform database dashboard to API format
   */
  private transformDashboard(dashboard: any): Dashboard {
    return {
      id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description,
      tenantId: dashboard.tenantId,
      ownerId: dashboard.ownerId,
      layout: dashboard.layout,
      theme: dashboard.theme,
      filters: dashboard.filters,
      settings: dashboard.settings,
      status: dashboard.status.toLowerCase(),
      version: dashboard.version,
      isPublic: dashboard.isPublic,
      shareToken: dashboard.shareToken,
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt,
      publishedAt: dashboard.publishedAt,
    }
  }

  /**
   * Transform dashboard with widgets to API format
   */
  private transformDashboardWithWidgets(dashboard: any): DashboardWithWidgets {
    return {
      ...this.transformDashboard(dashboard),
      widgets: dashboard.widgets.map((w: any) => this.transformWidget(w)),
    }
  }

  /**
   * Transform database widget to API format
   */
  private transformWidget(widget: any): Widget {
    return {
      id: widget.id,
      dashboardId: widget.dashboardId,
      name: widget.name,
      description: widget.description,
      type: widget.type.toLowerCase(),
      config: widget.config,
      query: widget.query,
      position: widget.position,
      style: widget.style,
      dataSourceId: widget.dataSourceId,
      isVisible: widget.isVisible,
      order: widget.order,
      createdAt: widget.createdAt,
      updatedAt: widget.updatedAt,
    }
  }
} 