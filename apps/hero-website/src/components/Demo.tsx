import React from 'react'
import { Play, Code2, Eye } from 'lucide-react'

const Demo: React.FC = () => {
  return (
    <section id="demo" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            See it in action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how easy it is to embed beautiful, interactive dashboards into your application
            with just a few lines of code.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Demo Video/Image */}
          <div className="relative">
            <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-gray-800 px-4 py-3 flex items-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-gray-400 text-sm">demo.js</span>
                </div>
              </div>
              <div className="p-6 bg-gray-900">
                <pre className="text-sm text-gray-300">
                  <code>{`import { createDashboard } from '@platform/sdk'

const dashboard = createDashboard({
  baseUrl: 'https://analytics.yourapp.com',
  token: 'your-jwt-token',
  dashboardId: 'sales-overview',
  container: '#dashboard-container',
  theme: {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff'
  },
  onLoad: () => console.log('Ready!')
})

// Control programmatically
await dashboard.setFilters({ region: 'US' })
await dashboard.refresh()`}</code>
                </pre>
              </div>
            </div>
            
            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-xl cursor-pointer hover:bg-opacity-20 transition-all duration-200">
              <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-8 h-8 text-gray-900 ml-1" />
              </div>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Code2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Simple Integration
                </h3>
                <p className="text-gray-600">
                  Add interactive dashboards to your app with just a few lines of code. 
                  No complex setup or configuration required.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Real-time Updates
                </h3>
                <p className="text-gray-600">
                  Data refreshes automatically or on-demand. Your users always see 
                  the latest information without page reloads.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Interactive Controls
                </h3>
                <p className="text-gray-600">
                  Users can filter, drill down, and export data. Full programmatic 
                  control via our comprehensive API.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Try Interactive Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Demo 