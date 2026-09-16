// nestfind/nestfind/client/src/pages/public/NotFoundPage.jsx

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, ArrowLeft } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import GradientText from '../../components/ui/GradientText'
import SEO from '../../components/common/SEO'

const NotFoundPage = () => {
  return (
    <PublicLayout showFooter={false}>
      <SEO title='404 - Page Not Found' />
      <div className='min-h-[80vh] flex items-center justify-center px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center max-w-md'
        >
          {/* 404 Number */}
          <div className='relative mb-6'>
            <p className='text-[120px] font-bold font-display leading-none bg-gradient-to-b from-yellow-400/30 to-transparent bg-clip-text text-transparent select-none'>
              404
            </p>
            <div className='absolute inset-0 flex items-center justify-center'>
              <span className='text-5xl'>🏠</span>
            </div>
          </div>

          <h1 className='text-2xl font-bold text-white font-display mb-3'>
            This page went <GradientText>missing</GradientText>
          </h1>
          <p className='text-gray-400 text-sm mb-8 leading-relaxed'>
            The page you're looking for doesn't exist or has been moved. Let's
            get you back to finding your perfect home.
          </p>

          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Link
              to='/'
              className='flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold rounded-xl hover:shadow-gold transition-all'
            >
              <Home size={16} />
              Go Home
            </Link>
            <Link
              to='/listings'
              className='flex items-center justify-center gap-2 px-6 py-3 border border-surface-border text-gray-300 font-medium rounded-xl hover:border-yellow-500/50 hover:text-yellow-400 transition-all'
            >
              <Search size={16} />
              Browse Properties
            </Link>
          </div>

          <button
            onClick={() => window.history.back()}
            className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-yellow-400 transition-colors mt-6 mx-auto'
          >
            <ArrowLeft size={13} />
            Go back
          </button>
        </motion.div>
      </div>
    </PublicLayout>
  )
}

export default NotFoundPage
