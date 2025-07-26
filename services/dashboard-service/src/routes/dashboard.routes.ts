import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DashboardService } from '../services/dashboard.service';
import { semanticLayerService } from '../services/semantic-layer.service';
import { logger } from '../utils/logger';

const dashboardService = new DashboardService();

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get all dashboards for a tenant
  fastify.get('/api/dashboards', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';
      const dashboards = await dashboardService.getDashboards(tenantId);
      
      reply.send({
        success: true,
        data: dashboards
      });
    } catch (error) {
      logger.error('Error fetching dashboards:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch dashboards'
      });
    }
  });

  // Get specific dashboard by ID
  fastify.get('/api/dashboards/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';
      
      const dashboard = await dashboardService.getDashboard(id, tenantId);
      
      if (!dashboard) {
        reply.status(404).send({
          success: false,
          error: 'Dashboard not found'
        });
        return;
      }

      reply.send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error fetching dashboard:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch dashboard'
      });
    }
  });

  // Create new dashboard
  fastify.post('/api/dashboards', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';
      const body = request.body as {
        title: string;
        description?: string;
        widgets?: any[];
        isPublic?: boolean;
      };

      const dashboard = await dashboardService.createDashboard({
        title: body.title,
        description: body.description,
        tenantId,
        widgets: body.widgets,
        isPublic: body.isPublic
      });

      reply.status(201).send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error creating dashboard:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to create dashboard'
      });
    }
  });

  // Update dashboard
  fastify.put('/api/dashboards/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';
      const body = request.body as {
        title?: string;
        description?: string;
        widgets?: any[];
        layout?: any;
        isPublic?: boolean;
      };

      const dashboard = await dashboardService.updateDashboard(id, body, tenantId);

      reply.send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error updating dashboard:', error);
      const status = error.message === 'Dashboard not found or access denied' ? 404 : 500;
      reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  });

  // Delete dashboard
  fastify.delete('/api/dashboards/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';

      await dashboardService.deleteDashboard(id, tenantId);

      reply.send({
        success: true,
        message: 'Dashboard deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting dashboard:', error);
      const status = error.message === 'Dashboard not found or access denied' ? 404 : 500;
      reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  });

  // Add widget to dashboard
  fastify.post('/api/dashboards/:id/widgets', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';
      const widget = request.body as {
        type: 'chart' | 'metric' | 'table' | 'filter';
        title: string;
        position: { x: number; y: number; width: number; height: number };
        config: any;
      };

      const dashboard = await dashboardService.addWidget(id, widget, tenantId);

      reply.status(201).send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error adding widget:', error);
      const status = error.message === 'Dashboard not found or access denied' ? 404 : 500;
      reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  });

  // Update widget
  fastify.put('/api/dashboards/:dashboardId/widgets/:widgetId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { dashboardId, widgetId } = request.params as { dashboardId: string; widgetId: string };
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';
      const widgetData = request.body as {
        type?: 'chart' | 'metric' | 'table' | 'filter';
        title?: string;
        position?: { x: number; y: number; width: number; height: number };
        config?: any;
      };

      const dashboard = await dashboardService.updateWidget(dashboardId, widgetId, widgetData, tenantId);

      reply.send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error updating widget:', error);
      const status = error.message === 'Dashboard not found or access denied' ? 404 : 500;
      reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  });

  // Remove widget
  fastify.delete('/api/dashboards/:dashboardId/widgets/:widgetId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { dashboardId, widgetId } = request.params as { dashboardId: string; widgetId: string };
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';

      const dashboard = await dashboardService.removeWidget(dashboardId, widgetId, tenantId);

      reply.send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error removing widget:', error);
      const status = error.message === 'Dashboard not found or access denied' ? 404 : 500;
      reply.status(status).send({
        success: false,
        error: error.message
      });
    }
  });

  // Create sample Netflix dashboard
  fastify.post('/api/dashboards/sample/netflix', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';
      
      const dashboard = await dashboardService.createSampleNetflixDashboard(tenantId);

      reply.status(201).send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error creating sample dashboard:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to create sample dashboard'
      });
    }
  });

  // Execute widget query and get data
  fastify.post('/api/dashboards/:dashboardId/widgets/:widgetId/data', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { dashboardId, widgetId } = request.params as { dashboardId: string; widgetId: string };
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';

      const dashboard = await dashboardService.getDashboard(dashboardId, tenantId);
      if (!dashboard) {
        reply.status(404).send({
          success: false,
          error: 'Dashboard not found'
        });
        return;
      }

      const widget = dashboard.widgets.find(w => w.id === widgetId);
      if (!widget) {
        reply.status(404).send({
          success: false,
          error: 'Widget not found'
        });
        return;
      }

      // For MVP, return mock data based on widget type
      let mockData = {};
      
      if (widget.type === 'metric') {
        // Generate metric data
        if (widget.title.includes('Total Content')) {
          mockData = { value: 5283, change: '+2.3%', trend: 'up' };
        } else if (widget.title.includes('Movies')) {
          mockData = { value: 4010, change: '+1.8%', trend: 'up' };
        } else if (widget.title.includes('TV Shows')) {
          mockData = { value: 1273, change: '+3.1%', trend: 'up' };
        } else if (widget.title.includes('IMDB Score')) {
          mockData = { value: 6.8, change: '+0.2', trend: 'up' };
        }
      } else if (widget.type === 'chart') {
        // Generate chart data based on chart type
        if (widget.config.chartType === 'line') {
          mockData = {
            labels: ['2020', '2021', '2022', '2023', '2024'],
            datasets: [{
              label: 'Content Count',
              data: [850, 920, 1050, 1180, 1283],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
          };
        } else if (widget.config.chartType === 'doughnut') {
          mockData = {
            labels: ['Movies', 'TV Shows'],
            datasets: [{
              data: [4010, 1273],
              backgroundColor: ['#3b82f6', '#10b981']
            }]
          };
        } else if (widget.config.chartType === 'bar') {
          mockData = {
            labels: ['Drama', 'Comedy', 'Action', 'Thriller', 'Horror', 'Romance', 'Sci-Fi', 'Documentary', 'Animation', 'Crime'],
            datasets: [{
              label: 'Genre Count',
              data: [1521, 985, 743, 602, 458, 387, 334, 298, 267, 231],
              backgroundColor: '#3b82f6'
            }]
          };
        }
      }

      reply.send({
        success: true,
        data: mockData
      });
    } catch (error) {
      logger.error('Error fetching widget data:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch widget data'
      });
    }
  });

  // === SEMANTIC LAYER ENDPOINTS ===

  // Get available metrics
  fastify.get('/api/semantic/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const metrics = semanticLayerService.getMetrics();
      reply.send({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error fetching metrics:', error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get available dimensions
  fastify.get('/api/semantic/dimensions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dimensions = semanticLayerService.getDimensions();
      reply.send({
        success: true,
        data: dimensions
      });
    } catch (error) {
      logger.error('Error fetching dimensions:', error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get available chart templates
  fastify.get('/api/semantic/chart-templates', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const templates = semanticLayerService.getChartTemplates();
      reply.send({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('Error fetching chart templates:', error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Generate widget configuration
  fastify.post('/api/semantic/generate-widget', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { metricIds, dimensionIds, chartTemplateId, title, filters } = request.body as {
        metricIds: string[];
        dimensionIds: string[];
        chartTemplateId: string;
        title?: string;
        filters?: Record<string, any>;
      };

      const widget = semanticLayerService.generateWidget(
        metricIds,
        dimensionIds,
        chartTemplateId,
        title,
        filters || {}
      );

      reply.send({
        success: true,
        data: widget
      });
    } catch (error) {
      logger.error('Error generating widget:', error);
      reply.status(400).send({
        success: false,
        error: error.message
      });
    }
  });

  // Create dynamic dashboard from widgets
  fastify.post('/api/dashboards/dynamic', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { title, description, widgets } = request.body as {
        title: string;
        description?: string;
        widgets: any[];
      };
      
      const tenantId = (request.headers['x-tenant-id'] as string) || 'demo-tenant';

      // Position widgets in a grid layout
      let currentX = 0;
      let currentY = 0;
      const gridColumns = 12;

      const positionedWidgets = widgets.map(widget => {
        const positionedWidget = {
          ...widget,
          position: {
            x: currentX,
            y: currentY,
            width: widget.position.width,
            height: widget.position.height
          }
        };

        // Update grid position for next widget
        currentX += widget.position.width;
        if (currentX >= gridColumns) {
          currentX = 0;
          currentY += widget.position.height;
        }

        return positionedWidget;
      });

      const dashboard = await dashboardService.createDashboard({
        title,
        description,
        tenantId,
        widgets: positionedWidgets,
        isPublic: true
      });

      reply.status(201).send({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error creating dynamic dashboard:', error);
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
} 