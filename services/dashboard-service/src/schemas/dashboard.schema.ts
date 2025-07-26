import { z } from 'zod'

// Common validation patterns
const stringId = z.string().min(1, 'ID is required')
const optionalString = z.string().optional()
const positiveInt = z.number().int().positive()
const nonNegativeInt = z.number().int().min(0)

// Dashboard status enum
export const DashboardStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

// Widget type enum
export const WidgetTypeSchema = z.enum([
  'BAR_CHART',
  'LINE_CHART', 
  'PIE_CHART',
  'AREA_CHART',
  'SCATTER_PLOT',
  'DOUGHNUT_CHART',
  'RADAR_CHART',
  'POLAR_AREA_CHART',
  'TABLE',
  'METRIC_CARD',
  'KPI_CARD',
  'PROGRESS_BAR',
  'GAUGE',
  'MAP',
  'HEATMAP',
  'TEXT',
  'IMAGE',
  'IFRAME',
  'FILTER'
])

// Dashboard role enum
export const DashboardRoleSchema = z.enum(['VIEWER', 'EDITOR', 'ADMIN'])

// Data source type enum
export const DataSourceTypeSchema = z.enum([
  'DATABRICKS',
  'BIGQUERY', 
  'SNOWFLAKE',
  'POSTGRESQL',
  'MYSQL',
  'DUCKDB',
  'REST_API'
])

// Grid layout schema
export const GridLayoutSchema = z.object({
  columns: z.number().int().min(1).max(24).default(12),
  rowHeight: z.number().int().min(10).max(500).default(50),
  margin: z.tuple([z.number(), z.number()]).default([10, 10]),
  containerPadding: z.tuple([z.number(), z.number()]).default([10, 10]),
  maxRows: z.number().int().min(1).optional()
})

// Theme configuration schema
export const ThemeConfigSchema = z.object({
  mode: z.enum(['light', 'dark', 'auto']).default('light'),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#1976d2'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#dc004e'),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#ffffff'),
  surfaceColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#f5f5f5'),
  textPrimary: z.string().regex(/^#[0-9A-F]{6}$/i).default('#212121'),
  textSecondary: z.string().regex(/^#[0-9A-F]{6}$/i).default('#757575'),
  borderColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#e0e0e0'),
  fontFamily: z.string().default('Inter, sans-serif'),
  fontSize: z.object({
    small: z.number().default(12),
    medium: z.number().default(14),
    large: z.number().default(16),
    xlarge: z.number().default(20)
  }).default({})
})

// Dashboard filter schema
export const DashboardFilterSchema = z.object({
  id: stringId,
  name: z.string().min(1, 'Filter name is required'),
  column: z.string().min(1, 'Column is required'),
  type: z.enum(['text', 'number', 'date', 'select', 'multiselect', 'range']),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'like', 'between']),
  value: z.any().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.any()
  })).optional(),
  required: z.boolean().default(false),
  visible: z.boolean().default(true)
})

// Dashboard settings schema
export const DashboardSettingsSchema = z.object({
  autoRefresh: z.boolean().default(false),
  refreshInterval: z.number().int().min(30).max(3600).default(300), // 5 minutes default
  allowExport: z.boolean().default(true),
  allowFiltering: z.boolean().default(true),
  allowDrillDown: z.boolean().default(false),
  showGrid: z.boolean().default(false),
  isResizable: z.boolean().default(true),
  isDraggable: z.boolean().default(true),
  compactType: z.enum(['vertical', 'horizontal']).default('vertical'),
  preventCollision: z.boolean().default(false),
  maxRows: z.number().int().min(1).optional(),
  breakpoints: z.object({
    lg: z.number().default(1200),
    md: z.number().default(996),
    sm: z.number().default(768),
    xs: z.number().default(480),
    xxs: z.number().default(0)
  }).default({}),
  cols: z.object({
    lg: z.number().default(12),
    md: z.number().default(10),
    sm: z.number().default(6),
    xs: z.number().default(4),
    xxs: z.number().default(2)
  }).default({})
})

// Widget position schema
export const WidgetPositionSchema = z.object({
  x: nonNegativeInt,
  y: nonNegativeInt,
  w: positiveInt.max(12),
  h: positiveInt.max(20),
  minW: z.number().int().min(1).optional(),
  minH: z.number().int().min(1).optional(),
  maxW: z.number().int().optional(),
  maxH: z.number().int().optional(),
  static: z.boolean().default(false),
  isDraggable: z.boolean().optional(),
  isResizable: z.boolean().optional()
})

// Chart.js specific configurations
export const ChartJsConfigSchema = z.object({
  type: z.enum(['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble']),
  data: z.object({
    labels: z.array(z.string()).optional(),
    datasets: z.array(z.object({
      label: z.string().optional(),
      data: z.array(z.any()),
      backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
      borderColor: z.union([z.string(), z.array(z.string())]).optional(),
      borderWidth: z.number().optional(),
      fill: z.boolean().optional(),
      tension: z.number().min(0).max(1).optional()
    }))
  }),
  options: z.object({
    responsive: z.boolean().default(true),
    maintainAspectRatio: z.boolean().default(false),
    plugins: z.object({
      title: z.object({
        display: z.boolean().default(false),
        text: z.string().optional()
      }).optional(),
      legend: z.object({
        display: z.boolean().default(true),
        position: z.enum(['top', 'bottom', 'left', 'right']).default('top')
      }).optional(),
      tooltip: z.object({
        enabled: z.boolean().default(true)
      }).optional()
    }).optional(),
    scales: z.object({
      x: z.object({
        display: z.boolean().default(true),
        title: z.object({
          display: z.boolean().default(false),
          text: z.string().optional()
        }).optional()
      }).optional(),
      y: z.object({
        display: z.boolean().default(true),
        title: z.object({
          display: z.boolean().default(false),
          text: z.string().optional()
        }).optional(),
        beginAtZero: z.boolean().default(true)
      }).optional()
    }).optional()
  }).optional()
})

// Table configuration schema
export const TableConfigSchema = z.object({
  columns: z.array(z.object({
    key: z.string(),
    title: z.string(),
    dataType: z.enum(['string', 'number', 'date', 'boolean']),
    sortable: z.boolean().default(true),
    filterable: z.boolean().default(true),
    width: z.number().optional(),
    format: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).default('left')
  })),
  pagination: z.object({
    enabled: z.boolean().default(true),
    pageSize: z.number().int().min(5).max(100).default(10),
    showSizeChanger: z.boolean().default(true)
  }).default({}),
  sorting: z.object({
    enabled: z.boolean().default(true),
    defaultSort: z.object({
      column: z.string(),
      direction: z.enum(['asc', 'desc'])
    }).optional()
  }).default({}),
  filtering: z.object({
    enabled: z.boolean().default(false),
    searchable: z.boolean().default(true)
  }).default({})
})

// Metric card configuration schema
export const MetricConfigSchema = z.object({
  title: z.string(),
  value: z.any(),
  unit: z.string().optional(),
  format: z.string().optional(),
  comparison: z.object({
    value: z.number(),
    period: z.string(),
    trend: z.enum(['up', 'down', 'neutral']).optional()
  }).optional(),
  threshold: z.object({
    warning: z.number().optional(),
    critical: z.number().optional()
  }).optional(),
  icon: z.string().optional(),
  color: z.string().optional()
})

// Widget query schema
export const WidgetQuerySchema = z.object({
  sql: z.string().min(1, 'SQL query is required'),
  parameters: z.record(z.any()).default({}),
  refreshInterval: z.number().int().min(0).default(0), // 0 = manual only
  cacheEnabled: z.boolean().default(true),
  cacheTtl: z.number().int().min(60).default(300) // 5 minutes default
})

// Widget styling schema
export const WidgetStylingSchema = z.object({
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().min(0).max(10).default(1),
  borderRadius: z.number().min(0).max(50).default(4),
  padding: z.number().min(0).max(50).default(16),
  margin: z.number().min(0).max(50).default(0),
  boxShadow: z.string().optional(),
  opacity: z.number().min(0).max(1).default(1),
  overflow: z.enum(['visible', 'hidden', 'scroll', 'auto']).default('hidden')
})

// Main widget configuration schema (discriminated union based on type)
export const WidgetConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('chart'),
    chartConfig: ChartJsConfigSchema
  }),
  z.object({
    type: z.literal('table'),
    tableConfig: TableConfigSchema
  }),
  z.object({
    type: z.literal('metric'),
    metricConfig: MetricConfigSchema
  }),
  z.object({
    type: z.literal('text'),
    content: z.string(),
    format: z.enum(['plain', 'markdown', 'html']).default('plain')
  }),
  z.object({
    type: z.literal('image'),
    src: z.string().url(),
    alt: z.string().optional(),
    fit: z.enum(['contain', 'cover', 'fill', 'scale-down']).default('contain')
  }),
  z.object({
    type: z.literal('iframe'),
    src: z.string().url(),
    allowFullscreen: z.boolean().default(false)
  }),
  z.object({
    type: z.literal('filter'),
    filterConfig: DashboardFilterSchema
  })
])

// Request schemas
export const CreateDashboardRequestSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').max(255),
  description: optionalString,
  layout: GridLayoutSchema.optional(),
  theme: ThemeConfigSchema.optional(),
  filters: z.array(DashboardFilterSchema).default([]),
  settings: DashboardSettingsSchema.optional()
})

export const UpdateDashboardRequestSchema = CreateDashboardRequestSchema.partial()

export const CreateWidgetRequestSchema = z.object({
  name: z.string().min(1, 'Widget name is required').max(255),
  description: optionalString,
  type: WidgetTypeSchema,
  config: WidgetConfigSchema,
  query: WidgetQuerySchema,
  position: WidgetPositionSchema,
  style: WidgetStylingSchema.optional(),
  dataSourceId: stringId
})

export const UpdateWidgetRequestSchema = CreateWidgetRequestSchema.partial()

export const BulkUpdateWidgetPositionsSchema = z.object({
  widgets: z.array(z.object({
    id: stringId,
    position: WidgetPositionSchema
  }))
})

// Dashboard permission schemas
export const CreateDashboardPermissionSchema = z.object({
  userId: stringId,
  role: DashboardRoleSchema
})

export const UpdateDashboardPermissionSchema = z.object({
  role: DashboardRoleSchema
})

// Data source schemas
export const CreateDataSourceRequestSchema = z.object({
  name: z.string().min(1, 'Data source name is required').max(255),
  description: optionalString,
  type: DataSourceTypeSchema,
  config: z.record(z.any()) // Flexible config object
})

export const UpdateDataSourceRequestSchema = CreateDataSourceRequestSchema.partial()

// Query execution schema
export const ExecuteQueryRequestSchema = z.object({
  sql: z.string().min(1, 'SQL query is required'),
  parameters: z.record(z.any()).default({}),
  cacheEnabled: z.boolean().default(true),
  cacheTtl: z.number().int().min(0).default(300),
  limit: z.number().int().min(1).max(10000).optional(),
  timeout: z.number().int().min(1000).max(300000).default(30000) // 30 seconds
})

// Share token schema
export const GenerateShareTokenRequestSchema = z.object({
  expiresAt: z.string().datetime().optional(),
  permissions: z.object({
    canView: z.boolean().default(true),
    canFilter: z.boolean().default(true),
    canExport: z.boolean().default(false),
    canRefresh: z.boolean().default(true)
  }).default({})
})

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// List dashboards query schema
export const ListDashboardsQuerySchema = PaginationSchema.extend({
  status: DashboardStatusSchema.optional(),
  search: z.string().optional(),
  ownedByMe: z.boolean().optional(),
  sharedWithMe: z.boolean().optional()
})

// Export type definitions for TypeScript
export type CreateDashboardRequest = z.infer<typeof CreateDashboardRequestSchema>
export type UpdateDashboardRequest = z.infer<typeof UpdateDashboardRequestSchema>
export type CreateWidgetRequest = z.infer<typeof CreateWidgetRequestSchema>
export type UpdateWidgetRequest = z.infer<typeof UpdateWidgetRequestSchema>
export type BulkUpdateWidgetPositions = z.infer<typeof BulkUpdateWidgetPositionsSchema>
export type CreateDashboardPermission = z.infer<typeof CreateDashboardPermissionSchema>
export type UpdateDashboardPermission = z.infer<typeof UpdateDashboardPermissionSchema>
export type CreateDataSourceRequest = z.infer<typeof CreateDataSourceRequestSchema>
export type UpdateDataSourceRequest = z.infer<typeof UpdateDataSourceRequestSchema>
export type ExecuteQueryRequest = z.infer<typeof ExecuteQueryRequestSchema>
export type GenerateShareTokenRequest = z.infer<typeof GenerateShareTokenRequestSchema>
export type ListDashboardsQuery = z.infer<typeof ListDashboardsQuerySchema>
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>
export type GridLayout = z.infer<typeof GridLayoutSchema>
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>
export type DashboardSettings = z.infer<typeof DashboardSettingsSchema>
export type WidgetPosition = z.infer<typeof WidgetPositionSchema>
export type WidgetStyling = z.infer<typeof WidgetStylingSchema>
export type ChartJsConfig = z.infer<typeof ChartJsConfigSchema>
export type TableConfig = z.infer<typeof TableConfigSchema>
export type MetricConfig = z.infer<typeof MetricConfigSchema>