import React from 'react'
import { Database, Zap, Shield, Code, BarChart3, Users } from 'lucide-react'

const Features: React.FC = () => {
  const features = [
    {
      icon: Database,
      title: 'Universal Data Connectivity',
      description: 'Connect to any data source - Databricks, BigQuery, Snowflake, PostgreSQL, MySQL, and more. Real-time data synchronization with intelligent caching.',
    },
    {
      icon: BarChart3,
      title: 'Rich Visualizations',
      description: 'Beautiful, interactive charts powered by D3.js. From simple metrics to complex geographic maps, create stunning visualizations that engage your users.',
    },
    {
      icon: Code,
      title: 'Developer-First SDK',
      description: 'Framework-agnostic TypeScript SDK with React components. Embed dashboards in minutes with comprehensive documentation and examples.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast Performance',
      description: 'Sub-second loading times with intelligent caching, connection pooling, and optimized rendering. Scale to millions of users effortlessly.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Multi-tenant architecture with JWT authentication, role-based access control, and comprehensive audit logging. SOC 2 compliant.',
    },
    {
      icon: Users,
      title: 'White-Label Ready',
      description: 'Complete customization with your branding, themes, and styling. Seamlessly integrate into your application without breaking the user experience.',
    },
  ]

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to embed analytics
          </h2>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            From data connectivity to beautiful visualizations, our platform provides all the tools 
            you need to create amazing embedded analytics experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features 