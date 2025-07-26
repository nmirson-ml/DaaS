import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Database, Zap, Shield } from 'lucide-react'

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-8"
          >
            <Zap className="w-4 h-4 mr-2" />
            Introducing Analytics Platform v1.0
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
          >
            <span className="block">Embed Analytics</span>
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Anywhere
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Build beautiful, interactive dashboards and embed them seamlessly into any application. 
            Connect to any data source, customize every pixel, and scale to millions of users.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center shadow-lg hover:shadow-xl">
              Start Building Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200">
              View Live Demo
            </button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            {[
              { icon: Database, text: 'Multi-Source Data' },
              { icon: BarChart3, text: 'Real-time Charts' },
              { icon: Shield, text: 'Enterprise Security' },
              { icon: Zap, text: 'Sub-second Loading' },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-gray-200"
              >
                <feature.icon className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-6xl mx-auto"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-100 px-4 py-3 flex items-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 text-center">
                  <div className="bg-white rounded-md px-3 py-1 text-sm text-gray-600 inline-block">
                    your-app.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Metric Cards */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">$2,847,392</div>
                    <div className="text-sm text-green-600">+12.5% from last month</div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
                      <Database className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">847,392</div>
                    <div className="text-sm text-green-600">+8.2% from last month</div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Conversion Rate</h3>
                      <Zap className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">24.8%</div>
                    <div className="text-sm text-green-600">+2.1% from last month</div>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="mt-6 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                  <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Interactive Chart Component</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              Live Data
            </div>
            <div className="absolute -bottom-4 -left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              Real-time
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Hero 