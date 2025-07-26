import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

export interface DaaSSDKConfig {
  token?: string;
  dashboardId: string;
  apiBaseUrl?: string;
  theme?: 'light' | 'dark';
  enableRefresh?: boolean;
  refreshInterval?: number;
}

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
    xAxis?: string;
    yAxis?: string;
    styling?: Record<string, any>;
  };
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  widgets: Widget[];
  layout: {
    grid: {
      columns: number;
      rows: number;
    };
  };
  isPublic: boolean;
}

export class DaaSSDK {
  private config: DaaSSDKConfig;
  private container: HTMLElement | null = null;
  private dashboard: Dashboard | null = null;
  private charts: Map<string, Chart> = new Map();
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: DaaSSDKConfig) {
    this.config = {
      apiBaseUrl: 'http://localhost:3013',
      theme: 'light',
      enableRefresh: false,
      refreshInterval: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Main method to render dashboard - Success criteria: 3 lines of code!
   */
  async render(selector: string | HTMLElement): Promise<void> {
    try {
      // Find container
      this.container = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;

      if (!this.container) {
        throw new Error('Container not found');
      }

      // Show loading state
      this.showLoading();

      // Fetch dashboard configuration
      await this.fetchDashboard();

      // Render dashboard
      await this.renderDashboard();

      // Setup auto-refresh if enabled
      if (this.config.enableRefresh) {
        this.setupAutoRefresh();
      }

      console.log(`DaaS Dashboard '${this.dashboard?.title}' rendered successfully`);
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to render dashboard');
      throw error;
    }
  }

  /**
   * Fetch dashboard configuration from API
   */
  private async fetchDashboard(): Promise<void> {
    const url = `${this.config.apiBaseUrl}/api/dashboards/${this.config.dashboardId}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch dashboard');
    }

    this.dashboard = result.data;
  }

  /**
   * Render the complete dashboard
   */
  private async renderDashboard(): Promise<void> {
    if (!this.container || !this.dashboard) return;

    // Clear container
    this.container.innerHTML = '';

    // Create dashboard container with CSS Grid
    const dashboardEl = document.createElement('div');
    dashboardEl.className = 'daas-dashboard';
    dashboardEl.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${this.dashboard.layout.grid.columns}, 1fr);
      grid-gap: 16px;
      padding: 20px;
      background: ${this.config.theme === 'dark' ? '#1a1a1a' : '#f8fafc'};
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    // Add dashboard title
    const titleEl = document.createElement('h1');
    titleEl.textContent = this.dashboard.title;
    titleEl.style.cssText = `
      grid-column: 1 / -1;
      margin: 0 0 20px 0;
      font-size: 28px;
      font-weight: 600;
      color: ${this.config.theme === 'dark' ? '#ffffff' : '#1f2937'};
    `;
    dashboardEl.appendChild(titleEl);

    // Render widgets
    for (const widget of this.dashboard.widgets) {
      const widgetEl = await this.renderWidget(widget);
      dashboardEl.appendChild(widgetEl);
    }

    this.container.appendChild(dashboardEl);
  }

  /**
   * Render individual widget
   */
  private async renderWidget(widget: Widget): Promise<HTMLElement> {
    const widgetEl = document.createElement('div');
    widgetEl.className = 'daas-widget';
    widgetEl.style.cssText = `
      grid-column: span ${widget.position.width};
      grid-row: span ${widget.position.height};
      background: ${this.config.theme === 'dark' ? '#2d2d2d' : '#ffffff'};
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid ${this.config.theme === 'dark' ? '#404040' : '#e5e7eb'};
      display: flex;
      flex-direction: column;
    `;

    // Widget title
    const titleEl = document.createElement('h3');
    titleEl.textContent = widget.title;
    titleEl.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: ${this.config.theme === 'dark' ? '#ffffff' : '#374151'};
    `;
    widgetEl.appendChild(titleEl);

    // Widget content
    const contentEl = document.createElement('div');
    contentEl.className = 'daas-widget-content';
    contentEl.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    `;

    if (widget.type === 'metric') {
      await this.renderMetricWidget(contentEl, widget);
    } else if (widget.type === 'chart') {
      await this.renderChartWidget(contentEl, widget);
    } else if (widget.type === 'table') {
      await this.renderTableWidget(contentEl, widget);
    }

    widgetEl.appendChild(contentEl);
    return widgetEl;
  }

  /**
   * Render metric widget
   */
  private async renderMetricWidget(container: HTMLElement, widget: Widget): Promise<void> {
    try {
      const data = await this.fetchWidgetData(widget.id);
      
      container.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 36px; font-weight: 700; color: ${this.config.theme === 'dark' ? '#ffffff' : '#1f2937'}; margin-bottom: 8px;">
            ${data.value || 'N/A'}
          </div>
          <div style="font-size: 14px; color: ${data.trend === 'up' ? '#10b981' : '#ef4444'};">
            ${data.change || ''}
          </div>
        </div>
      `;
    } catch (error) {
      container.innerHTML = `<div style="color: #ef4444;">Error loading metric</div>`;
    }
  }

  /**
   * Render chart widget
   */
  private async renderChartWidget(container: HTMLElement, widget: Widget): Promise<void> {
    try {
      const canvas = document.createElement('canvas');
      canvas.style.maxHeight = '300px';
      container.appendChild(canvas);

      const data = await this.fetchWidgetData(widget.id);
      
      const config: ChartConfiguration = {
        type: widget.config.chartType as any || 'bar',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: this.config.theme === 'dark' ? '#ffffff' : '#374151'
              }
            }
          },
          scales: widget.config.chartType !== 'pie' && widget.config.chartType !== 'doughnut' ? {
            x: {
              ticks: {
                color: this.config.theme === 'dark' ? '#ffffff' : '#374151'
              },
              grid: {
                color: this.config.theme === 'dark' ? '#404040' : '#e5e7eb'
              }
            },
            y: {
              ticks: {
                color: this.config.theme === 'dark' ? '#ffffff' : '#374151'
              },
              grid: {
                color: this.config.theme === 'dark' ? '#404040' : '#e5e7eb'
              }
            }
          } : undefined
        },
      };

      const chart = new Chart(canvas, config);
      this.charts.set(widget.id, chart);
    } catch (error) {
      container.innerHTML = `<div style="color: #ef4444;">Error loading chart</div>`;
    }
  }

  /**
   * Render table widget
   */
  private async renderTableWidget(container: HTMLElement, widget: Widget): Promise<void> {
    try {
      const data = await this.fetchWidgetData(widget.id);
      
      // Simple table rendering for MVP
      container.innerHTML = `
        <div style="color: ${this.config.theme === 'dark' ? '#ffffff' : '#374151'};">
          Table widget (${widget.title})
        </div>
      `;
    } catch (error) {
      container.innerHTML = `<div style="color: #ef4444;">Error loading table</div>`;
    }
  }

  /**
   * Fetch widget data from API
   */
  private async fetchWidgetData(widgetId: string): Promise<any> {
    if (!this.dashboard) throw new Error('Dashboard not loaded');

    const url = `${this.config.apiBaseUrl}/api/dashboards/${this.dashboard.id}/widgets/${widgetId}/data`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch widget data: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch widget data');
    }

    return result.data;
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        color: ${this.config.theme === 'dark' ? '#ffffff' : '#374151'};
      ">
        <div style="text-align: center;">
          <div style="margin-bottom: 12px;">Loading dashboard...</div>
          <div style="
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          "></div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  /**
   * Show error state
   */
  private showError(message: string): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        color: #ef4444;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <div style="font-size: 18px; margin-bottom: 8px;">⚠️ Error</div>
          <div>${message}</div>
        </div>
      </div>
    `;
  }

  /**
   * Setup auto-refresh
   */
  private setupAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      try {
        await this.refresh();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, this.config.refreshInterval);
  }

  /**
   * Refresh dashboard data
   */
  async refresh(): Promise<void> {
    if (!this.dashboard) return;

    // Refresh all widgets
    for (const widget of this.dashboard.widgets) {
      try {
        if (widget.type === 'metric') {
          const metricEl = document.querySelector(`[data-widget-id="${widget.id}"] .daas-widget-content`);
          if (metricEl) {
            await this.renderMetricWidget(metricEl as HTMLElement, widget);
          }
        } else if (widget.type === 'chart') {
          const chart = this.charts.get(widget.id);
          if (chart) {
            const newData = await this.fetchWidgetData(widget.id);
            chart.data = newData;
            chart.update();
          }
        }
      } catch (error) {
        console.error(`Failed to refresh widget ${widget.id}:`, error);
      }
    }
  }

  /**
   * Destroy SDK instance
   */
  destroy(): void {
    // Clear refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Destroy charts
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Reset state
    this.dashboard = null;
    this.container = null;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DaaSSDKConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current dashboard
   */
  getDashboard(): Dashboard | null {
    return this.dashboard;
  }
}

// Default export for easy importing
export default DaaSSDK;

// Global window access for CDN usage
if (typeof window !== 'undefined') {
  (window as any).DaaSSDK = DaaSSDK;
} 