// nestfind/nestfind/client/src/context/NotificationContext.jsx

import { createContext, useContext, useEffect, useCallback } from 'react'
import { create } from 'zustand'
import notificationApi from '../api/notificationApi'
import { useAuthStore } from './AuthContext'
import toast from 'react-hot-toast'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const response = await notificationApi.getNotifications({ limit: 50 })
      const notifications = response.data.data || []
      set({
        notifications,
        unreadCount: notifications.filter(
          n => !n.isRead && n.status !== 'archived'
        ).length,
        loading: false
      })
    } catch {
      set({ loading: false })
    }
  },

  markAsRead: async id => {
    try {
      await notificationApi.markAsRead(id)
      set(state => ({
        notifications: state.notifications.map(n =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch {}
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead()
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }))
    } catch {}
  },

  archiveNotification: async id => {
    try {
      await notificationApi.archiveNotification(id)
      set(state => ({
        notifications: state.notifications.map(n =>
          n._id === id ? { ...n, status: 'archived' } : n
        ),
        unreadCount: state.notifications.find(n => n._id === id && !n.isRead)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount
      }))
    } catch {}
  },

  deleteNotification: async id => {
    try {
      await notificationApi.deleteNotification(id)
      set(state => ({
        notifications: state.notifications.filter(n => n._id !== id),
        unreadCount: state.notifications.find(n => n._id === id && !n.isRead)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount
      }))
    } catch {}
  },

  addRealTimeNotification: notification => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }))
    toast(`🔔 ${notification.title}`, {
      duration: 4000,
      position: 'top-right'
    })
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 })
}))

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { fetchNotifications, addRealTimeNotification } = useNotificationStore()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
    }
  }, [isAuthenticated])

  return (
    <NotificationContext.Provider value={useNotificationStore()}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationContext
