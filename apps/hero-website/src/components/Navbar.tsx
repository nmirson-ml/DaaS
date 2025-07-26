import React from 'react'
import { BarChart3, Menu, X } from 'lucide-react'

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Analytics Platform</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#features" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Features
              </a>
              <a href="#demo" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Demo
              </a>
              <a href="#pricing" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Pricing
              </a>
              <a href="/docs" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Docs
              </a>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Sign In
              </button>
              <button className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <a href="#features" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              Features
            </a>
            <a href="#demo" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              Demo
            </a>
            <a href="#pricing" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              Pricing
            </a>
            <a href="/docs" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              Docs
            </a>
            <button className="w-full text-left text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              Sign In
            </button>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium">
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar 