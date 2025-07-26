# DaaS - Dashboard as a Service Platform

> **Embedded Analytics Made Simple** - Build beautiful, interactive dashboards and embed them seamlessly into any application.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://www.docker.com/)

## 🚀 Overview

DaaS is a modern, TypeScript-first embedded analytics platform that enables developers to build and embed interactive dashboards into any application. Connect to multiple data sources, create stunning visualizations, and scale to millions of users with enterprise-grade security.

### ✨ Key Features

- **🔌 Universal Data Connectivity** - Connect to Databricks, BigQuery, Snowflake, PostgreSQL, and more
- **🎨 Drag & Drop Builder** - Visual dashboard builder with real-time preview
- **📊 Rich Visualizations** - Charts, tables, metrics, and custom components
- **🔒 Enterprise Security** - Multi-tenant architecture with JWT authentication
- **⚡ High Performance** - Sub-second query responses with intelligent caching
- **🎯 Easy Embedding** - TypeScript SDK for seamless integration
- **📱 Mobile Ready** - Responsive dashboards that work everywhere
- **🔧 Developer Friendly** - Comprehensive APIs and documentation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DaaS Platform                           │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Apps          │  Microservices          │  Storage   │
│                         │                         │            │
│  ┌─────────────────┐   │  ┌─────────────────┐   │  ┌────────┐ │
│  │ Dashboard       │   │  │ Auth Service    │   │  │ PostgreSQL │
│  │ Builder         │   │  │ (JWT + Multi-   │   │  │        │ │
│  │                 │   │  │  tenant)        │   │  └────────┘ │
│  └─────────────────┘   │  └─────────────────┘   │            │
│                         │                         │  ┌────────┐ │
│  ┌─────────────────┐   │  ┌─────────────────┐   │  │ Redis  │ │
│  │ Hero Website    │   │  │ Query Engine    │   │  │ Cache  │ │
│  │                 │   │  │ (Databricks +   │   │  └────────┘ │
│  └─────────────────┘   │  │  Caching)       │   │            │
│                         │  └─────────────────┘   │            │
│  ┌─────────────────┐   │                         │            │
│  │ TypeScript SDK  │   │  ┌─────────────────┐   │            │
│  │                 │   │  │ Dashboard       │   │            │
│  └─────────────────┘   │  │ Service         │   │            │
│                         │  └─────────────────┘   │            │
│                         │                         │            │
│                         │  ┌─────────────────┐   │            │
│                         │  │ Visualization   │   │            │
│                         │  │ Engine          │   │            │
│                         │  └─────────────────┘   │            │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend Services
- **Runtime**: Node.js 20+ with TypeScript 5.0+
- **Framework**: Fastify (high performance, TypeScript-native)
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for query results and sessions
- **Authentication**: JWT with multi-tenant support

### Frontend Applications
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (fast compilation)
- **Visualization**: D3.js v7 + Recharts
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Framer Motion
- **Drag & Drop**: react-grid-layout

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes ready
- **API Gateway**: Traefik
- **Monitoring**: Prometheus + Grafana

## 📁 Project Structure

```
daas/
├── packages/
│   └── shared-types/          # Shared TypeScript definitions
├── services/
│   ├── auth-service/          # JWT authentication & multi-tenancy
│   ├── query-engine/          # Data source connections & SQL execution
│   ├── dashboard-service/     # Dashboard & widget management
│   ├── visualization-service/ # Chart generation & rendering
│   └── embedding-sdk/         # TypeScript SDK for embedding
├── apps/
│   ├── dashboard-builder/     # React dashboard builder app
│   └── hero-website/          # Marketing website & demos
├── docker-compose.yml         # Development environment
└── k8s/                      # Kubernetes deployment configs
```

## 🚦 Quick Start

### Prerequisites

- Node.js 20+ and npm/pnpm
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### 1. Clone and Install

```bash
git clone https://github.com/your-org/daas.git
cd daas

# Install dependencies (use pnpm for workspace support)
npm install -g pnpm
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.sample .env

# Configure your data sources (example for Databricks)
DATABRICKS_HOSTNAME=your-workspace.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
DATABRICKS_ACCESS_TOKEN=your-access-token
```

### 3. Start Development Environment

```bash
# Start all services with Docker Compose
docker-compose up -d

# Or run services individually
pnpm run dev:auth      # Auth service (port 3001)
pnpm run dev:query     # Query engine (port 3002)
pnpm run dev:dashboard # Dashboard service (port 3003)
pnpm run dev:viz       # Visualization service (port 3004)
pnpm run dev:app       # Dashboard builder (port 3000)
pnpm run dev:hero      # Hero website (port 3005)
```

### 4. Access Applications

- **Dashboard Builder**: http://localhost:3000
- **Hero Website**: http://localhost:3005
- **API Gateway**: http://localhost:8080
- **Traefik Dashboard**: http://localhost:8080/dashboard/

## 📚 Usage Examples

### Embedding a Dashboard

```typescript
import { EmbeddedDashboard } from '@daas/embedding-sdk'

// Initialize the dashboard
const dashboard = new EmbeddedDashboard({
  token: 'your-jwt-token',
  baseUrl: 'https://api.your-daas-platform.com',
  dashboardId: 'dashboard-uuid',
  theme: 'light'
})

// Render in a container
await dashboard.render('dashboard-container')

// Listen for events
dashboard.on('load', () => console.log('Dashboard loaded!'))
dashboard.on('filter', (filters) => console.log('Filters applied:', filters))

// Programmatic control
await dashboard.setFilters({ region: 'US', dateRange: 'last-30-days' })
await dashboard.refresh()
const pdfBlob = await dashboard.exportToPDF()
```

### Creating a Dashboard Programmatically

```typescript
import { DashboardAPI } from '@daas/client'

const api = new DashboardAPI({
  baseUrl: 'https://api.your-daas-platform.com',
  token: 'your-jwt-token'
})

// Create a new dashboard
const dashboard = await api.createDashboard({
  name: 'Sales Performance',
  description: 'Q4 sales metrics and trends',
  layout: { columns: 12, rowHeight: 100 },
  widgets: [
    {
      type: 'chart',
      position: { x: 0, y: 0, width: 6, height: 4 },
      query: {
        sql: 'SELECT date, revenue FROM sales WHERE date >= ?',
        parameters: { startDate: '2024-01-01' }
      },
      visualization: {
        type: 'line',
        config: { xAxis: 'date', yAxis: 'revenue' }
      }
    }
  ]
})
```

## 🔧 Configuration

### Database Configuration

The platform uses PostgreSQL for metadata and Redis for caching:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/daas
REDIS_URL=redis://localhost:6379
```

### JWT Configuration

```env
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

### Data Source Configuration

Configure your data sources via environment variables or the admin interface:

```env
# Databricks
DATABRICKS_HOSTNAME=your-workspace.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/warehouse-id
DATABRICKS_ACCESS_TOKEN=your-token

# BigQuery
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
BIGQUERY_PROJECT_ID=your-project-id
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific service
pnpm test:auth
pnpm test:query
pnpm test:dashboard

# Run with coverage
pnpm test:coverage

# Run integration tests
pnpm test:e2e
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build all services
docker-compose build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=daas
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-db:5432/daas
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=your-production-secret
ALLOWED_ORIGINS=https://your-app.com,https://your-dashboard.com
```

## 📖 API Documentation

### Authentication Endpoints

```http
POST /api/v1/auth/login          # User login
POST /api/v1/auth/register       # User registration
POST /api/v1/auth/refresh        # Token refresh
GET  /api/v1/auth/me            # Current user info
```

### Dashboard Management

```http
GET    /api/v1/dashboards           # List dashboards
POST   /api/v1/dashboards           # Create dashboard
GET    /api/v1/dashboards/{id}      # Get dashboard
PUT    /api/v1/dashboards/{id}      # Update dashboard
DELETE /api/v1/dashboards/{id}      # Delete dashboard
GET    /api/v1/dashboards/{id}/data # Get dashboard data
```

### Query Execution

```http
POST   /api/v1/query/execute        # Execute SQL query
GET    /api/v1/datasources          # List data sources
POST   /api/v1/datasources/test     # Test connection
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `pnpm install`
4. Start development environment: `docker-compose up -d`
5. Make your changes and add tests
6. Run tests: `pnpm test`
7. Commit changes: `git commit -m 'Add amazing feature'`
8. Push to branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed

## 📋 Roadmap

### Current (MVP - Q1 2025)
- ✅ Multi-tenant authentication
- ✅ Databricks connector
- ✅ Basic dashboard builder
- ✅ TypeScript embedding SDK
- ✅ Chart visualization engine

### Phase 2 (Q2 2025)
- [ ] BigQuery and Snowflake connectors
- [ ] Advanced chart types (heatmaps, scatter plots)
- [ ] Real-time data updates via WebSockets
- [ ] Dashboard sharing and collaboration
- [ ] Mobile-responsive dashboards

### Phase 3 (Q3 2025)
- [ ] White-label customization
- [ ] SSO integration (SAML, OIDC)
- [ ] Advanced permissions and governance
- [ ] API rate limiting and quotas
- [ ] Automated testing and deployment

### Phase 4 (Q4 2025)
- [ ] AI-powered chart recommendations
- [ ] Natural language query interface
- [ ] Anomaly detection and alerting
- [ ] Machine learning model integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.daas-platform.com](https://docs.daas-platform.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/daas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/daas/discussions)
- **Email**: support@daas-platform.com

## 🙏 Acknowledgments

- [Fastify](https://www.fastify.io/) for the high-performance backend framework
- [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/) for the frontend
- [D3.js](https://d3js.org/) for powerful data visualizations
- [Prisma](https://www.prisma.io/) for type-safe database access
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

---

**Built with ❤️ for developers who need powerful, embeddable analytics**

*Star ⭐ this repo if you find it useful!*