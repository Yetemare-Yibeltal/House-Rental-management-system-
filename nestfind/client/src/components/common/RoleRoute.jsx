// nestfind/nestfind/client/src/components/common/RoleRoute.jsx

import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../context/AuthContext'

const RoleRoute = ({ children, roles = [], fallback = '/' }) => {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore()

  if (!isInitialized || isLoading) {
    return (
      <div className='min-h-screen bg-dark flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin' />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    const dashboardMap = {
      tenant: '/tenant/dashboard',
      landlord: '/landlord/dashboard',
      admin: '/admin/dashboard'
    }
    return <Navigate to={dashboardMap[user?.role] || fallback} replace />
  }

  return children
}

export default RoleRoute
