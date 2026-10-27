// nestfind/nestfind/client/src/context/AuthContext.jsx

import { createContext, useContext } from 'react'
import { create } from 'zustand'
import authApi from '../api/authApi'
import {
  getAccessToken,
  setTokens,
  clearAuthData,
  isTokenExpired
} from '../utils/tokenService'

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  isAdmin: false,
  isLandlord: false,
  isTenant: false,

  initialize: async () => {
    const token = getAccessToken()
    if (!token || isTokenExpired(token)) {
      set({ isInitialized: true, isAuthenticated: false, user: null })
      return
    }
    set({ isLoading: true })
    try {
      const response = await authApi.getMe()
      const user = response.data.data
      set({
        user,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
        isAdmin: user?.role === 'admin',
        isLandlord: user?.role === 'landlord',
        isTenant: user?.role === 'tenant'
      })
    } catch {
      clearAuthData()
      set({
        isInitialized: true,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        isAdmin: false,
        isLandlord: false,
        isTenant: false
      })
    }
  },

  setUser: user =>
    set({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isLandlord: user?.role === 'landlord',
      isTenant: user?.role === 'tenant'
    }),

  setTokensAndUser: (accessToken, refreshToken, user) => {
    setTokens(accessToken, refreshToken)
    set({
      user,
      isAuthenticated: true,
      isAdmin: user?.role === 'admin',
      isLandlord: user?.role === 'landlord',
      isTenant: user?.role === 'tenant'
    })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {}
    clearAuthData()
    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLandlord: false,
      isTenant: false
    })
    window.location.href = '/login'
  },

  refreshUser: async () => {
    try {
      const response = await authApi.getMe()
      const user = response.data.data
      set({
        user,
        isAdmin: user?.role === 'admin',
        isLandlord: user?.role === 'landlord',
        isTenant: user?.role === 'tenant'
      })
    } catch {}
  }
}))

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
)

export default AuthContext
