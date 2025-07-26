import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Demo from './components/Demo'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import Documentation from './pages/Documentation'
import './App.css'

function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <Features />
      <Demo />
      <Pricing />
    </motion.div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/docs/*" element={<Documentation />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App 