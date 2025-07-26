import React from 'react'
import { Database, Zap, Shield, Code, BarChart3, Users, Terminal, Monitor } from 'lucide-react'

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

        {/* SDK Code Examples Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Programmatic Dashboard Creation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build dashboards programmatically with our TypeScript SDK. Create charts with code or embed existing dashboards into any application.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart Creation Example */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-6 py-4 flex items-center">
                <Terminal className="w-5 h-5 text-green-400 mr-3" />
                <span className="text-white font-medium">Create Charts with Code</span>
              </div>
              <div className="p-6">
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-gray-400 mb-2">// Install the SDK</div>
                  <div className="text-green-400 mb-4">npm install @analytics-platform/sdk</div>
                  
                  <div className="text-gray-400 mb-2">// Create dashboard programmatically</div>
                  <div className="text-blue-300">import</div> <div className="text-white">{'{ DaaSSDK }'}</div> <div className="text-blue-300">from</div> <div className="text-yellow-300">'@analytics-platform/sdk'</div>
                  <br/><br/>
                  <div className="text-blue-300">const</div> <div className="text-white">sdk</div> <div className="text-blue-300">=</div> <div className="text-blue-300">new</div> <div className="text-yellow-300">DaaSSDK</div><div className="text-white">({'{'}</div>
                  <br/>
                  <div className="ml-4 text-white">apiBaseUrl: <div className="text-yellow-300">'https://api.your-domain.com'</div>,</div>
                  <br/>
                  <div className="ml-4 text-white">theme: <div className="text-yellow-300">'light'</div></div>
                  <br/>
                  <div className="text-white">{'});'}</div>
                  <br/><br/>
                  <div className="text-gray-400">// Generate chart from semantic layer</div>
                  <div className="text-blue-300">const</div> <div className="text-white">chart</div> <div className="text-blue-300">=</div> <div className="text-blue-3">await</div> <div className="text-white">sdk</div><div className="text-blue-300">.</div><div className="text-yellow-300">createChart</div><div className="text-white">({'{'}</div>
                  <br/>
                  <div className="ml-4 text-white">metrics: [<div className="text-yellow-300">'total_content'</div>],</div>
                  <br/>
                  <div className="ml-4 text-white">dimensions: [<div className="text-yellow-300">'content_type'</div>],</div>
                  <br/>
                  <div className="ml-4 text-white">chartType: <div className="text-yellow-300">'bar'</div>,</div>
                  <br/>
                  <div className="ml-4 text-white">title: <div className="text-yellow-300">'Netflix Content Distribution'</div></div>
                  <br/>
                  <div className="text-white">{'});'}</div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Generate charts dynamically using our semantic layer with Netflix metrics and dimensions.
                </div>
              </div>
            </div>

            {/* Embedding Example */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-6 py-4 flex items-center">
                <Monitor className="w-5 h-5 text-blue-400 mr-3" />
                <span className="text-white font-medium">Embed in Your App</span>
              </div>
              <div className="p-6">
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-gray-400 mb-2">// React Component Example</div>
                  <div className="text-blue-300">import</div> <div className="text-white">React</div> <div className="text-blue-3">from</div> <div className="text-yellow-300">'react'</div>
                  <br/>
                  <div className="text-blue-3">import</div> <div className="text-white">{'{ DashboardEmbed }'}</div> <div className="text-blue-3">from</div> <div className="text-yellow-300">'@analytics-platform/react'</div>
                  <br/><br/>
                  <div className="text-blue-3">function</div> <div className="text-yellow-300">MyApp</div><div className="text-white">() {'{'}</div>
                  <br/>
                  <div className="ml-4 text-blue-3">return</div> <div className="text-white">{'('}</div>
                  <br/>
                  <div className="ml-8 text-white">{'<'}<div className="text-blue-300">div</div> <div className="text-green-300">className</div><div className="text-white">=</div><div className="text-yellow-300">"dashboard-container"</div><div className="text-white">{'>'}</div></div>
                  <br/>
                  <div className="ml-12 text-white">{'<'}<div className="text-blue-300">DashboardEmbed</div></div>
                  <br/>
                  <div className="ml-16 text-green-300">dashboardId</div><div className="text-white">=</div><div className="text-yellow-300">"netflix-analytics"</div>
                  <br/>
                  <div className="ml-16 text-green-300">apiBaseUrl</div><div className="text-white">=</div><div className="text-yellow-300">"https://api.your-domain.com"</div>
                  <br/>
                  <div className="ml-16 text-green-300">theme</div><div className="text-white">=</div><div className="text-yellow-300">"light"</div>
                  <br/>
                  <div className="ml-16 text-green-300">height</div><div className="text-white">=</div><div className="text-yellow-300">"600px"</div>
                  <br/>
                  <div className="ml-12 text-white">{'/>'}</div>
                  <br/>
                  <div className="ml-8 text-white">{'</'}<div className="text-blue-300">div</div><div className="text-white">{'>'}</div></div>
                  <br/>
                  <div className="ml-4 text-white">{')'}</div>
                  <br/>
                  <div className="text-white">{'}'}</div>
                  <br/><br/>
                  <div className="text-gray-400">// Or vanilla JavaScript</div>
                  <div className="text-blue-3">const</div> <div className="text-white">sdk</div> <div className="text-blue-3">=</div> <div className="text-blue-3">new</div> <div className="text-yellow-300">DaaSSDK</div><div className="text-white">({'{'}</div>
                  <br/>
                  <div className="ml-4 text-white">dashboardId: <div className="text-yellow-300">'netflix-analytics'</div></div>
                  <br/>
                  <div className="text-white">{'});'}</div>
                  <br/>
                  <div className="text-white">sdk</div><div className="text-blue-3">.</div><div className="text-yellow-300">render</div><div className="text-white">(<div className="text-yellow-300">'#dashboard'</div>);</div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Embed dashboards seamlessly with React components or vanilla JavaScript.
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
              <Code className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">TypeScript Support</h3>
              <p className="text-sm text-gray-600">Full type safety with comprehensive TypeScript definitions</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
              <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-sm text-gray-600">Live data synchronization with automatic chart updates</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Secure by Default</h3>
              <p className="text-sm text-gray-600">JWT authentication and role-based access control built-in</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features 