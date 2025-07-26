import { logger } from '../utils/logger';

export interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'filter';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
    query?: string;
    dataSource?: string;
    aggregation?: string;
    xAxis?: string;
    yAxis?: string;
    styling?: Record<string, any>;
  };
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string | undefined;
  widgets: Widget[];
  layout: {
    grid: {
      columns: number;
      rows: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  isPublic: boolean;
}

// In-memory storage for MVP
const dashboards = new Map<string, Dashboard>();

export class DashboardService {
  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(data: {
    title: string;
    description?: string;
    tenantId: string;
    widgets?: Widget[];
    isPublic?: boolean;
  }): Promise<Dashboard> {
    try {
      const dashboard: Dashboard = {
        id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title,
        description: data.description,
        tenantId: data.tenantId,
        widgets: data.widgets || [],
        layout: {
          grid: {
            columns: 12,
            rows: 10
          }
        },
        isPublic: data.isPublic || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      dashboards.set(dashboard.id, dashboard);
      logger.info(`Dashboard created: ${dashboard.id}`);
      return dashboard;
    } catch (error) {
      logger.error('Error creating dashboard:', error);
      throw new Error('Failed to create dashboard');
    }
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(id: string, tenantId?: string): Promise<Dashboard | null> {
    try {
      const dashboard = dashboards.get(id);
      
      if (!dashboard) {
        return null;
      }

      // Check access permissions
      if (!dashboard.isPublic && dashboard.tenantId !== tenantId) {
        return null;
      }

      return dashboard;
    } catch (error) {
      logger.error('Error fetching dashboard:', error);
      throw new Error('Failed to fetch dashboard');
    }
  }

  /**
   * Get all dashboards for a tenant
   */
  async getDashboards(tenantId: string): Promise<Dashboard[]> {
    try {
      const result: Dashboard[] = [];
      
      for (const dashboard of dashboards.values()) {
        if (dashboard.tenantId === tenantId || dashboard.isPublic) {
          result.push(dashboard);
        }
      }

      return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      logger.error('Error fetching dashboards:', error);
      throw new Error('Failed to fetch dashboards');
    }
  }

  /**
   * Update dashboard
   */
  async updateDashboard(id: string, data: Partial<Dashboard>, tenantId: string): Promise<Dashboard> {
    try {
      const existingDashboard = await this.getDashboard(id, tenantId);
      if (!existingDashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      const updatedDashboard: Dashboard = {
        ...existingDashboard,
        ...data,
        id: existingDashboard.id, // Ensure ID doesn't change
        createdAt: existingDashboard.createdAt, // Preserve creation date
        updatedAt: new Date(),
      };

      dashboards.set(id, updatedDashboard);
      logger.info(`Dashboard updated: ${id}`);
      return updatedDashboard;
    } catch (error) {
      logger.error('Error updating dashboard:', error);
      throw new Error('Failed to update dashboard');
    }
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(id: string, tenantId: string): Promise<void> {
    try {
      const existingDashboard = await this.getDashboard(id, tenantId);
      if (!existingDashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      dashboards.delete(id);
      logger.info(`Dashboard deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting dashboard:', error);
      throw new Error('Failed to delete dashboard');
    }
  }

  /**
   * Add widget to dashboard
   */
  async addWidget(dashboardId: string, widget: Omit<Widget, 'id'>, tenantId: string): Promise<Dashboard> {
    try {
      const dashboard = await this.getDashboard(dashboardId, tenantId);
      if (!dashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      const newWidget: Widget = {
        ...widget,
        id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const updatedWidgets = [...dashboard.widgets, newWidget];

      return await this.updateDashboard(dashboardId, { widgets: updatedWidgets }, tenantId);
    } catch (error) {
      logger.error('Error adding widget:', error);
      throw new Error('Failed to add widget');
    }
  }

  /**
   * Update widget in dashboard
   */
  async updateWidget(dashboardId: string, widgetId: string, widgetData: Partial<Widget>, tenantId: string): Promise<Dashboard> {
    try {
      const dashboard = await this.getDashboard(dashboardId, tenantId);
      if (!dashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      const updatedWidgets = dashboard.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...widgetData } : widget
      );

      return await this.updateDashboard(dashboardId, { widgets: updatedWidgets }, tenantId);
    } catch (error) {
      logger.error('Error updating widget:', error);
      throw new Error('Failed to update widget');
    }
  }

  /**
   * Remove widget from dashboard
   */
  async removeWidget(dashboardId: string, widgetId: string, tenantId: string): Promise<Dashboard> {
    try {
      const dashboard = await this.getDashboard(dashboardId, tenantId);
      if (!dashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      const updatedWidgets = dashboard.widgets.filter(widget => widget.id !== widgetId);

      return await this.updateDashboard(dashboardId, { widgets: updatedWidgets }, tenantId);
    } catch (error) {
      logger.error('Error removing widget:', error);
      throw new Error('Failed to remove widget');
    }
  }

  /**
   * Create sample Netflix dashboard
   */
  async createSampleNetflixDashboard(tenantId: string): Promise<Dashboard> {
    const sampleWidgets: Widget[] = [
      {
        id: 'total-content-metric',
        type: 'metric',
        title: 'Total Content',
        position: { x: 0, y: 0, width: 3, height: 2 },
        config: {
          query: 'SELECT COUNT(*) as count FROM netflix_imdb',
          dataSource: 'netflix'
        }
      },
      {
        id: 'movies-metric',
        type: 'metric',
        title: 'Movies',
        position: { x: 3, y: 0, width: 3, height: 2 },
        config: {
          query: "SELECT COUNT(*) as count FROM netflix_imdb WHERE type = 'Movie'",
          dataSource: 'netflix'
        }
      },
      {
        id: 'shows-metric',
        type: 'metric',
        title: 'TV Shows',
        position: { x: 6, y: 0, width: 3, height: 2 },
        config: {
          query: "SELECT COUNT(*) as count FROM netflix_imdb WHERE type = 'TV Show'",
          dataSource: 'netflix'
        }
      },
      {
        id: 'avg-rating-metric',
        type: 'metric',
        title: 'Avg IMDB Score',
        position: { x: 9, y: 0, width: 3, height: 2 },
        config: {
          query: 'SELECT ROUND(AVG(imdb_score), 1) as avg_score FROM netflix_imdb WHERE imdb_score IS NOT NULL',
          dataSource: 'netflix'
        }
      },
      {
        id: 'content-by-year-chart',
        type: 'chart',
        title: 'Content by Release Year',
        position: { x: 0, y: 2, width: 6, height: 4 },
        config: {
          chartType: 'line',
          query: 'SELECT release_year, COUNT(*) as count FROM netflix_imdb WHERE release_year IS NOT NULL GROUP BY release_year ORDER BY release_year',
          dataSource: 'netflix',
          xAxis: 'release_year',
          yAxis: 'count'
        }
      },
      {
        id: 'content-by-type-chart',
        type: 'chart',
        title: 'Content Distribution',
        position: { x: 6, y: 2, width: 6, height: 4 },
        config: {
          chartType: 'doughnut',
          query: 'SELECT type, COUNT(*) as count FROM netflix_imdb GROUP BY type',
          dataSource: 'netflix',
          xAxis: 'type',
          yAxis: 'count'
        }
      },
      {
        id: 'top-genres-chart',
        type: 'chart',
        title: 'Top Genres',
        position: { x: 0, y: 6, width: 12, height: 4 },
        config: {
          chartType: 'bar',
          query: `SELECT 
                    TRIM(value) as genre, 
                    COUNT(*) as count 
                  FROM netflix_imdb, 
                  json_each('[' || '"' || replace(replace(listed_in, ', ', '","'), ',', '","') || '"' || ']') 
                  WHERE listed_in IS NOT NULL 
                  GROUP BY TRIM(value) 
                  ORDER BY count DESC 
                  LIMIT 10`,
          dataSource: 'netflix',
          xAxis: 'genre',
          yAxis: 'count'
        }
      }
    ];

    return await this.createDashboard({
      title: 'Netflix Content Analytics',
      description: 'Comprehensive analytics dashboard for Netflix IMDB dataset',
      tenantId,
      widgets: sampleWidgets,
      isPublic: true
    });
  }

  /**
   * Initialize sample data for demo
   */
  private async initializeSampleData(): Promise<void> {
    try {
      // Check if sample dashboard already exists
      const existing = Array.from(dashboards.values()).find(d => d.title === 'Netflix Content Analytics');
      if (existing) return;

      // Create sample dashboard
      await this.createSampleNetflixDashboard('demo-tenant');
      logger.info('Sample Netflix dashboard initialized');
    } catch (error) {
      logger.error('Error initializing sample data:', error);
    }
  }
} 