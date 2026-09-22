// nestfind/nestfind/client/src/context/AuthContext.jsx

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react'
import { create } from 'zustand'
import authApi from '../api/authApi'
import { tokenService } from '../utils/tokenService'

// ── Zustand store ──────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Derived role helpers
  get isAdmin () {
    return get().user?.role === 'admin'
  },
  get isLandlord () {
    return get().user?.role === 'landlord'
  },
  get isTenant () {
    return get().user?.role === 'tenant'
  },

  initialize: async () => {
    const token = tokenService.getAccessToken()
    if (!token || tokenService.isTokenExpired(token)) {
      set({ isInitialized: true, isAuthenticated: false, user: null })
      return
    }
    set({ isLoading: true })
    try {
      const response = await authApi.getMe()
      set({
        user: response.data.data,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false
      })
    } catch {
      tokenService.clearAuthData()
      set({
        isInitialized: true,
        isAuthenticated: false,
        user: null,
        isLoading: false
      })
    }
  },

  setUser: user => set({ user, isAuthenticated: !!user }),

  logout: async () => {
    try {
      await authApi.logout()
    } catch {}
    tokenService.clearAuthData()
    set({ user: null, isAuthenticated: false })
    window.location.href = '/login'
  },

  refreshUser: async () => {
    try {
      const response = await authApi.getMe()
      set({ user: response.data.data })
    } catch {}
  }
}))

// ── Context (for components that prefer context over zustand) ──────────────
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const store = useAuthStore()
  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthContext
