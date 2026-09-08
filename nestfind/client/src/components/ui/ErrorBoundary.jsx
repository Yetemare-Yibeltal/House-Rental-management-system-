// nestfind/nestfind/client/src/components/ui/ErrorBoundary.jsx

import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError (error) {
    return { hasError: true, error }
  }

  componentDidCatch (error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render () {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-dark flex items-center justify-center p-4'>
          <div className='max-w-md w-full text-center'>
            <div className='w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6'>
              <AlertTriangle size={36} className='text-red-400' />
            </div>

            <h1 className='text-2xl font-bold text-white mb-3 font-display'>
              Something went wrong
            </h1>

            <p className='text-gray-400 text-sm mb-2'>
              An unexpected error occurred. Our team has been notified.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className='mb-6 text-left'>
                <summary className='text-xs text-gray-500 cursor-pointer hover:text-yellow-400 mb-2'>
                  Error details (development only)
                </summary>
                <div className='bg-surface-card border border-surface-border rounded-xl p-4 overflow-auto max-h-48'>
                  <p className='text-xs text-red-400 font-mono'>
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className='text-xs text-gray-500 mt-2 whitespace-pre-wrap'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className='flex gap-3 justify-center'>
              <button
                onClick={this.handleReset}
                className='flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-black rounded-xl font-semibold text-sm hover:bg-yellow-400 transition-colors'
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className='flex items-center gap-2 px-5 py-2.5 border border-surface-border text-gray-300 rounded-xl font-semibold text-sm hover:border-yellow-500/50 hover:text-yellow-400 transition-colors'
              >
                <Home size={16} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
