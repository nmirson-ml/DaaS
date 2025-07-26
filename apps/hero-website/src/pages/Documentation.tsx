import React from 'react'
import { BookOpen, ArrowLeft } from 'lucide-react'

const Documentation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </a>
          <div className="flex items-center mb-4">
            <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          </div>
          <p className="text-xl text-gray-600">
            Everything you need to get started with our Analytics Platform
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Guide</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Installation</h3>
              <div className="bg-gray-900 rounded-lg p-4">
                <code className="text-green-400">
                  npm install @platform/embedding-sdk
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Basic Usage</h3>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-sm text-gray-300">
                  <code>{`import { createDashboard } from '@platform/embedding-sdk'

const dashboard = createDashboard({
  baseUrl: 'https://your-analytics-platform.com',
  token: 'your-jwt-token',
  dashboardId: 'your-dashboard-id',
  container: '#dashboard-container'
})

// Listen for events
dashboard.on('load', () => {
  console.log('Dashboard loaded!')
})

dashboard.on('error', (error) => {
  console.error('Dashboard error:', error)
})`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Configuration Options</h3>
              <p className="text-gray-600 mb-3">
                Customize your dashboard with themes, filters, and interaction modes:
              </p>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-sm text-gray-300">
                  <code>{`const dashboard = createDashboard({
  baseUrl: 'https://your-analytics-platform.com',
  token: 'your-jwt-token',
  dashboardId: 'your-dashboard-id',
  container: '#dashboard-container',
  
  // Customization options
  theme: {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937'
  },
  
  // Initial filters
  filters: {
    dateRange: 'last-30-days',
    region: 'US'
  },
  
  // Interaction mode
  interactionMode: 'view', // 'view' | 'interact' | 'edit'
  
  // Features
  allowDownload: true,
  allowShare: true,
  allowFullscreen: true
})`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Programmatic Control</h3>
              <p className="text-gray-600 mb-3">
                Control your dashboard programmatically with our comprehensive API:
              </p>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-sm text-gray-300">
                  <code>{`// Refresh data
await dashboard.refresh()

// Update filters
await dashboard.setFilters({ region: 'EU' })

// Export dashboard
const pdfBlob = await dashboard.exportToPDF()
const imageBlob = await dashboard.exportToImage('png')

// Theme changes
dashboard.setTheme({
  primaryColor: '#10b981'
})

// Cleanup
dashboard.destroy()`}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>Need more help?</strong> Check out our complete documentation with more examples, 
              API reference, and tutorials at <a href="#" className="underline">docs.analytics-platform.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Documentation 