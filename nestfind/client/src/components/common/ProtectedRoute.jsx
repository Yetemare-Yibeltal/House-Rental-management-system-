// nestfind/nestfind/client/src/components/common/ProtectedRoute.jsx

import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../context/AuthContext'

const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized || isLoading) {
    return (
      <div className='min-h-screen bg-dark flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin' />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
