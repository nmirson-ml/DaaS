import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { DashboardProvider } from './contexts/DashboardContext'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import DashboardList from './pages/DashboardList'
import DashboardBuilder from './pages/DashboardBuilder'
import DashboardView from './pages/DashboardView'
import Login from './pages/Login'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <DashboardProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<DashboardList />} />
                    <Route path="dashboards" element={<DashboardList />} />
                    <Route path="dashboards/:id" element={<DashboardView />} />
                    <Route path="dashboards/:id/edit" element={<DashboardBuilder />} />
                    <Route path="dashboards/new" element={<DashboardBuilder />} />
                  </Route>
                </Routes>
              </div>
              <Toaster position="top-right" richColors />
            </Router>
          </DashboardProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App 