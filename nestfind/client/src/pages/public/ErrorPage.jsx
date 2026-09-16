// nestfind/nestfind/client/src/pages/public/ErrorPage.jsx

import { Link, useRouteError } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import GradientText from '../../components/ui/GradientText'
import SEO from '../../components/common/SEO'

const ErrorPage = () => {
  const error = useRouteError()

  const isNotFound = error?.status === 404
  const message = isNotFound
    ? 'The page you are looking for does not exist.'
    : error?.message || 'An unexpected error occurred.'

  return (
    <div className='min-h-screen bg-dark flex items-center justify-center px-4'>
      <SEO title={isNotFound ? '404 Not Found' : 'Error'} />

      <div className='text-center max-w-md'>
        <div className='w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6'>
          <AlertTriangle size={36} className='text-red-400' />
        </div>

        <h1 className='text-4xl font-bold font-display mb-3'>
          {isNotFound ? (
            <GradientText>404</GradientText>
          ) : (
            <GradientText>Oops!</GradientText>
          )}
        </h1>
        <h2 className='text-xl font-bold text-white mb-3'>
          {isNotFound ? 'Page Not Found' : 'Something Went Wrong'}
        </h2>
        <p className='text-gray-400 text-sm mb-8 leading-relaxed'>{message}</p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Link
            to='/'
            className='flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold rounded-xl hover:shadow-gold transition-all'
          >
            <Home size={16} />
            Go Home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className='flex items-center justify-center gap-2 px-6 py-3 border border-surface-border text-gray-300 font-medium rounded-xl hover:border-yellow-500/50 hover:text-yellow-400 transition-all'
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>

        {import.meta.env.DEV && error && (
          <details className='mt-8 text-left'>
            <summary className='text-xs text-gray-500 cursor-pointer hover:text-yellow-400'>
              Error details (dev only)
            </summary>
            <pre className='mt-2 text-xs text-red-400 bg-surface-card border border-surface-border rounded-xl p-4 overflow-auto max-h-48'>
              {error.stack || JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export default ErrorPage
