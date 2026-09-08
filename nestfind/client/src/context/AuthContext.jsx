// nestfind/nestfind/client/src/context/AuthContext.jsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'
import authApi from '../api/authApi'
import {
  getAccessToken,
  setAccessToken,
  clearAuthData,
  getStoredUser,
  setStoredUser
} from '../utils/tokenService'

const AuthContext = createContext(null)

export const useAuthStore = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthStore must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => getStoredUser())
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!getAccessToken()
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const setUser = useCallback(userData => {
    if (userData && typeof userData === 'function') {
      setUserState(prev => {
        const updated = userData(prev)
        setStoredUser(updated)
        return updated
      })
    } else {
      setUserState(userData)
      setStoredUser(userData)
    }
  }, [])

  const setAuthenticated = useCallback(value => {
    setIsAuthenticated(value)
  }, [])

  const clearUser = useCallback(() => {
    setUserState(null)
    setIsAuthenticated(false)
    clearAuthData()
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe()
      const freshUser = response.data.data.user
      setUser(freshUser)
      return freshUser
    } catch {
      return null
    }
  }, [setUser])

  // Initialize — verify token and load user on app start
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      const token = getAccessToken()

      if (!token) {
        setIsLoading(false)
        setIsInitialized(true)
        return
      }

      try {
        const response = await authApi.getMe()
        const freshUser = response.data.data.user
        setUser(freshUser)
        setIsAuthenticated(true)
      } catch (err) {
        if (err.response?.status === 401) {
          try {
            const refreshResponse = await authApi.refreshToken()
            const { accessToken } = refreshResponse.data.data
            setAccessToken(accessToken)
            const userResponse = await authApi.getMe()
            setUser(userResponse.data.data.user)
            setIsAuthenticated(true)
          } catch {
            clearAuthData()
            setIsAuthenticated(false)
            setUserState(null)
          }
        }
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    initialize()
  }, [])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    setUser,
    setAuthenticated,
    clearUser,
    refreshUser,
    isAdmin: user?.role === 'admin',
    isLandlord: user?.role === 'landlord',
    isTenant: user?.role === 'tenant',
    isKYCVerified: user?.isKYCVerified || false,
    isEmailVerified: user?.isEmailVerified || false
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
