// Core Types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: Date
  updatedAt: Date
}

export interface Tenant {
  id: string
  name: string
  subdomain: string
  plan: 'free' | 'pro' | 'enterprise'
  settings: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface UserTenant {
  userId: string
  tenantId: string
  role: UserRole
  permissions: string[]
  createdAt: Date
}

export type UserRole = 'admin' | 'editor' | 'viewer'

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  tenantName?: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
  tenant: Tenant
  expiresIn: number
}

export interface TokenPayload {
  sub: string // user id
  email: string
  tenant_id: string
  role: UserRole
  permissions: string[]
  iat: number
  exp: number
}

// Data Source Types
export interface DataSource {
  id: string
  tenantId: string
  name: string
  type: DataSourceType
  config: DataSourceConfig
  status: 'active' | 'inactive' | 'error'
  lastTestedAt?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type DataSourceType = 'databricks' | 'bigquery' | 'snowflake' | 'postgres'

export interface DataSourceConfig {
  hostname?: string
  port?: number
  database?: string
  username?: string
  password?: string
  accessToken?: string
  httpPath?: string
  catalog?: string
  schema?: string
  [key: string]: any
}

// Query Types
export interface QueryRequest {
  tenantId: string
  dataSourceId: string
  sql: string
  parameters?: Record<string, any>
  cacheKey?: string
  ttl?: number
}

export interface QueryResult {
  data: any[]
  columns: ColumnDefinition[]
  executionTime: number
  totalRows: number
  cached: boolean
  cacheKey?: string
}

export interface ColumnDefinition {
  name: string
  type: ColumnType
  nullable?: boolean
  description?: string
}

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'object'

// Dashboard Types
export interface Dashboard {
  id: string
  tenantId: string
  name: string
  description?: string
  layout: DashboardLayout
  widgets: Widget[]
  settings: DashboardSettings
  status: 'active' | 'archived'
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface DashboardLayout {
  grid: {
    columns: number
    rowHeight: number
  }
  theme?: 'light' | 'dark' | 'custom'
}

export interface DashboardSettings {
  refreshInterval?: number
  autoRefresh?: boolean
  allowExport?: boolean
  allowFiltering?: boolean
  theme?: ThemeConfig
}

export interface Widget {
  id: string
  dashboardId: string
  name: string
  type: WidgetType
  position: WidgetPosition
  query: WidgetQuery
  visualization: VisualizationConfig
  styling: WidgetStyling
  createdAt: Date
  updatedAt: Date
}

export type WidgetType = 'chart' | 'table' | 'metric' | 'filter'

export interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface WidgetQuery {
  dataSourceId: string
  sql: string
  parameters: Record<string, any>
  refreshInterval?: number
}

// Visualization Types
export interface VisualizationConfig {
  type: ChartType
  dimensions: string[]
  measures: string[]
  config: ChartConfig
  styling: ChartStyling
}

export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'metric'

export interface ChartConfig {
  title?: string
  xAxis?: AxisConfig
  yAxis?: AxisConfig
  legend?: LegendConfig
  series?: SeriesConfig[]
  [key: string]: any
}

export interface AxisConfig {
  title?: string
  type?: 'category' | 'value' | 'time'
  format?: string
  min?: number
  max?: number
}

export interface LegendConfig {
  show: boolean
  position: 'top' | 'bottom' | 'left' | 'right'
}

export interface SeriesConfig {
  name: string
  type: ChartType
  color?: string
  stack?: string
}

export interface ChartStyling {
  colors: string[]
  fonts: FontConfig
  spacing: SpacingConfig
  theme: 'light' | 'dark' | 'custom'
  customCSS?: string
}

export interface FontConfig {
  family: string
  size: number
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
}

export interface SpacingConfig {
  padding: number
  margin: number
}

export interface WidgetStyling {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  margin?: number
}

// Embedding Types
export interface EmbedConfig {
  dashboardId: string
  token: string
  baseUrl: string
  theme?: ThemeConfig
  allowedDomains?: string[]
  interactionMode?: 'view' | 'interact' | 'edit'
  branding?: BrandingConfig
}

export interface EmbedToken {
  token: string
  dashboardId: string
  permissions: EmbedPermissions
  userContext?: UserContext
  expiresAt: Date
  createdAt: Date
}

export interface EmbedPermissions {
  canView: boolean
  canFilter: boolean
  canExport: boolean
  canRefresh: boolean
  allowedDomains?: string[]
}

export interface UserContext {
  userId?: string
  email?: string
  name?: string
  metadata?: Record<string, any>
}

export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  fontFamily: string
}

export interface BrandingConfig {
  logo?: string
  companyName?: string
  colors?: {
    primary: string
    secondary: string
  }
  customCSS?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// Event Types
export interface PlatformEvent {
  type: string
  tenantId: string
  userId?: string
  data: Record<string, any>
  timestamp: Date
}

// Filter Types
export interface FilterSet {
  [key: string]: FilterValue
}

export type FilterValue = string | number | boolean | Date | (string | number)[]

export interface Filter {
  column: string
  operator: FilterOperator
  value: FilterValue
}

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'between'

// Utility Types
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ConnectionResult {
  success: boolean
  message: string
  metadata?: Record<string, any>
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: Date
  checks: HealthCheck[]
}

export interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message?: string
  duration?: number
}