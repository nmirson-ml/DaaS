import { logger } from '../utils/logger';

export interface Metric {
  id: string;
  name: string;
  description: string;
  sql: string;
  type: 'count' | 'sum' | 'avg' | 'min' | 'max';
  format?: string;
}

export interface Dimension {
  id: string;
  name: string;
  description: string;
  sql: string;
  type: 'string' | 'number' | 'date';
}

export interface ChartTemplate {
  id: string;
  name: string;
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  description: string;
  requiredMetrics: number;
  requiredDimensions: number;
  maxDimensions?: number;
}

class SemanticLayerService {
  // Netflix dataset metrics
  private readonly metrics: Metric[] = [
    {
      id: 'total_content',
      name: 'Total Content',
      description: 'Total number of movies and TV shows',
      sql: 'COUNT(*)',
      type: 'count'
    },
    {
      id: 'avg_imdb_score',
      name: 'Average IMDB Score',
      description: 'Average IMDB rating across all content',
      sql: 'AVG(imdb_score)',
      type: 'avg',
      format: '0.1'
    },
    {
      id: 'avg_duration',
      name: 'Average Duration',
      description: 'Average duration in minutes',
      sql: 'AVG(CAST(REGEXP_EXTRACT(duration, \'(\\d+)\') AS INTEGER))',
      type: 'avg',
      format: '0'
    },
    {
      id: 'content_with_rating',
      name: 'Content with Rating',
      description: 'Count of content that has IMDB ratings',
      sql: 'COUNT(*) FILTER (WHERE imdb_score IS NOT NULL)',
      type: 'count'
    },
    {
      id: 'max_imdb_score',
      name: 'Highest IMDB Score',
      description: 'Highest IMDB rating',
      sql: 'MAX(imdb_score)',
      type: 'max',
      format: '0.1'
    },
    {
      id: 'min_imdb_score',
      name: 'Lowest IMDB Score',
      description: 'Lowest IMDB rating',
      sql: 'MIN(imdb_score)',
      type: 'min',
      format: '0.1'
    }
  ];

  // Netflix dataset dimensions
  private readonly dimensions: Dimension[] = [
    {
      id: 'content_type',
      name: 'Content Type',
      description: 'Movie or TV Show',
      sql: 'type',
      type: 'string'
    },
    {
      id: 'release_year',
      name: 'Release Year',
      description: 'Year the content was released',
      sql: 'release_year',
      type: 'number'
    },
    {
      id: 'rating',
      name: 'Content Rating',
      description: 'Age rating (PG, R, etc.)',
      sql: 'rating',
      type: 'string'
    },
    {
      id: 'country',
      name: 'Country',
      description: 'Primary country of origin',
      sql: 'country',
      type: 'string'
    },
    {
      id: 'decade',
      name: 'Decade',
      description: 'Decade of release',
      sql: 'FLOOR(release_year / 10) * 10',
      type: 'number'
    },
    {
      id: 'imdb_score_range',
      name: 'IMDB Score Range',
      description: 'IMDB score grouped by ranges',
      sql: `CASE 
        WHEN imdb_score >= 8.0 THEN 'Excellent (8.0+)'
        WHEN imdb_score >= 7.0 THEN 'Good (7.0-7.9)'
        WHEN imdb_score >= 6.0 THEN 'Average (6.0-6.9)'
        WHEN imdb_score >= 5.0 THEN 'Below Average (5.0-5.9)'
        ELSE 'Poor (<5.0)'
      END`,
      type: 'string'
    }
  ];

  // Chart templates
  private readonly chartTemplates: ChartTemplate[] = [
    {
      id: 'metric_card',
      name: 'Metric Card',
      type: 'bar',
      description: 'Single metric display',
      requiredMetrics: 1,
      requiredDimensions: 0
    },
    {
      id: 'bar_chart',
      name: 'Bar Chart',
      type: 'bar',
      description: 'Compare metrics across categories',
      requiredMetrics: 1,
      requiredDimensions: 1,
      maxDimensions: 1
    },
    {
      id: 'line_chart',
      name: 'Line Chart',
      type: 'line',
      description: 'Show trends over time or ordered dimensions',
      requiredMetrics: 1,
      requiredDimensions: 1,
      maxDimensions: 1
    },
    {
      id: 'pie_chart',
      name: 'Pie Chart',
      type: 'pie',
      description: 'Show distribution of a metric',
      requiredMetrics: 1,
      requiredDimensions: 1,
      maxDimensions: 1
    },
    {
      id: 'doughnut_chart',
      name: 'Doughnut Chart',
      type: 'doughnut',
      description: 'Show distribution with center space',
      requiredMetrics: 1,
      requiredDimensions: 1,
      maxDimensions: 1
    },
    {
      id: 'area_chart',
      name: 'Area Chart',
      type: 'area',
      description: 'Show trends with filled area',
      requiredMetrics: 1,
      requiredDimensions: 1,
      maxDimensions: 1
    }
  ];

  getMetrics(): Metric[] {
    return this.metrics;
  }

  getDimensions(): Dimension[] {
    return this.dimensions;
  }

  getChartTemplates(): ChartTemplate[] {
    return this.chartTemplates;
  }

  getMetric(id: string): Metric | undefined {
    return this.metrics.find(m => m.id === id);
  }

  getDimension(id: string): Dimension | undefined {
    return this.dimensions.find(d => d.id === id);
  }

  getChartTemplate(id: string): ChartTemplate | undefined {
    return this.chartTemplates.find(t => t.id === id);
  }

  /**
   * Generate SQL query based on selected metrics and dimensions
   */
  generateQuery(
    metricIds: string[],
    dimensionIds: string[] = [],
    filters: Record<string, any> = {},
    limit?: number
  ): string {
    const metrics = metricIds.map(id => this.getMetric(id)).filter(Boolean) as Metric[];
    const dimensions = dimensionIds.map(id => this.getDimension(id)).filter(Boolean) as Dimension[];

    if (metrics.length === 0) {
      throw new Error('At least one metric is required');
    }

    // Build SELECT clause
    const selectParts: string[] = [];
    
    // Add dimensions
    dimensions.forEach(dim => {
      selectParts.push(`${dim.sql} as ${dim.id}`);
    });

    // Add metrics
    metrics.forEach(metric => {
      selectParts.push(`${metric.sql} as ${metric.id}`);
    });

    let query = `SELECT ${selectParts.join(', ')} FROM netflix_imdb`;

    // Add WHERE clause for filters
    const whereConditions: string[] = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'string') {
          whereConditions.push(`${key} = '${value}'`);
        } else {
          whereConditions.push(`${key} = ${value}`);
        }
      }
    });

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add GROUP BY if we have dimensions
    if (dimensions.length > 0) {
      const groupByFields = dimensions.map((_, index) => (index + 1).toString());
      query += ` GROUP BY ${groupByFields.join(', ')}`;
    }

    // Add ORDER BY for better presentation
    if (dimensions.length > 0) {
      if (dimensions[0].type === 'number') {
        query += ` ORDER BY ${dimensions[0].id}`;
      } else {
        query += ` ORDER BY ${metrics[0].id} DESC`;
      }
    }

    // Add LIMIT
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    return query;
  }

  /**
   * Generate widget configuration for dashboard
   */
  generateWidget(
    metricIds: string[],
    dimensionIds: string[],
    chartTemplateId: string,
    title?: string,
    filters: Record<string, any> = {}
  ): any {
    const template = this.getChartTemplate(chartTemplateId);
    if (!template) {
      throw new Error(`Chart template ${chartTemplateId} not found`);
    }

    const metrics = metricIds.map(id => this.getMetric(id)).filter(Boolean);
    const dimensions = dimensionIds.map(id => this.getDimension(id)).filter(Boolean);

    if (metrics.length < template.requiredMetrics) {
      throw new Error(`Chart requires ${template.requiredMetrics} metrics, got ${metrics.length}`);
    }

    if (dimensions.length < template.requiredDimensions) {
      throw new Error(`Chart requires ${template.requiredDimensions} dimensions, got ${dimensions.length}`);
    }

    const query = this.generateQuery(metricIds, dimensionIds, filters, 20);

    const widget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.id === 'metric_card' ? 'metric' : 'chart',
      title: title || `${metrics[0].name}${dimensions.length > 0 ? ` by ${dimensions[0].name}` : ''}`,
      position: {
        x: 0,
        y: 0,
        width: template.type === 'metric_card' ? 3 : 6,
        height: template.type === 'metric_card' ? 2 : 4
      },
      config: {
        chartType: template.type,
        query: query,
        dataSource: 'netflix',
        xAxis: dimensions.length > 0 ? dimensions[0].id : undefined,
        yAxis: metrics[0].id,
        metrics: metrics.map(m => ({ id: m.id, name: m.name })),
        dimensions: dimensions.map(d => ({ id: d.id, name: d.name })),
        filters: filters
      }
    };

    logger.info('Generated widget:', { widget, query });
    return widget;
  }
}

export const semanticLayerService = new SemanticLayerService();