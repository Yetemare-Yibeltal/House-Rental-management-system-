// nestfind/nestfind/client/src/components/layout/AuthLayout.jsx

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import Toast from '../ui/Toast'
import GoldCursor from '../ui/GoldCursor'
import GradientText from '../ui/GradientText'

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className='min-h-screen bg-dark flex'>
      <GoldCursor />
      <Toast />

      {/* Left Side — Decorative */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden'>
        {/* Background */}
        <div className='absolute inset-0 bg-gradient-to-br from-dark via-surface-card to-dark' />

        {/* Gold Grid Pattern */}
        <div
          className='absolute inset-0 opacity-5'
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Glowing Orbs */}
        <div className='absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-48 h-48 bg-yellow-600/8 rounded-full blur-2xl' />

        {/* Content */}
        <div className='relative z-10 flex flex-col justify-between p-12 w-full'>
          {/* Logo */}
          <Link to='/' className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center'>
              <Home size={20} className='text-black' />
            </div>
            <span className='text-2xl font-bold font-display'>
              <GradientText>NestFind</GradientText>
            </span>
          </Link>

          {/* Hero Text */}
          <div className='space-y-6'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className='text-4xl font-bold font-display text-white leading-tight'>
                Find Your Perfect Home in <GradientText>Ethiopia</GradientText>
              </h1>
              <p className='text-gray-400 text-lg mt-4 leading-relaxed'>
                AI-powered rental platform connecting verified tenants with
                trusted landlords across Addis Ababa.
              </p>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className='flex flex-wrap gap-2'
            >
              {[
                '🤖 AI Smart Search',
                '✅ Verified Listings',
                '📋 Digital Contracts',
                '💳 Secure Payments',
                '🔧 Maintenance Track'
              ].map(feature => (
                <span
                  key={feature}
                  className='px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full'
                >
                  {feature}
                </span>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className='grid grid-cols-3 gap-6'
            >
              {[
                { value: '5,000+', label: 'Listings' },
                { value: '2,000+', label: 'Tenants' },
                { value: '1,000+', label: 'Landlords' }
              ].map(({ value, label }) => (
                <div key={label} className='text-center'>
                  <p className='text-2xl font-bold font-display'>
                    <GradientText>{value}</GradientText>
                  </p>
                  <p className='text-xs text-gray-500 mt-0.5'>{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom */}
          <p className='text-xs text-gray-600'>
            © {new Date().getFullYear()} NestFind. Powered by Claude AI.
          </p>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className='w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto'>
        {/* Mobile Logo */}
        <Link to='/' className='flex items-center gap-2 mb-8 lg:hidden'>
          <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center'>
            <Home size={16} className='text-black' />
          </div>
          <span className='text-xl font-bold font-display'>
            <GradientText>NestFind</GradientText>
          </span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className='w-full max-w-md'
        >
          {(title || subtitle) && (
            <div className='mb-6'>
              {title && (
                <h2 className='text-2xl font-bold text-white font-display'>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className='text-gray-400 text-sm mt-1'>{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </motion.div>
      </div>
    </div>
  )
}

export default AuthLayout
