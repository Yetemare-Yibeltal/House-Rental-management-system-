// nestfind/nestfind/client/src/context/NotificationContext.jsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'
import notificationApi from '../api/notificationApi'
import { useAuthStore } from './AuthContext'
import { useSocketStore } from './SocketContext'
import toast from 'react-hot-toast'

const NotificationContext = createContext(null)

export const useNotificationStore = () => {
  const context = useContext(NotificationContext)
  if (!context)
    throw new Error(
      'useNotificationStore must be used within NotificationProvider'
    )
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { isAuthenticated } = useAuthStore()
  const { socket } = useSocketStore()

  const fetchNotifications = useCallback(
    async (pageNum = 1, unreadOnly = false) => {
      if (!isAuthenticated) return
      setLoading(true)
      try {
        const response = await notificationApi.getNotifications({
          page: pageNum,
          limit: 20,
          unreadOnly
        })
        const { data, pagination } = response.data
        if (pageNum === 1) setNotifications(data)
        else setNotifications(prev => [...prev, ...data])
        setUnreadCount(pagination.unreadCount || 0)
        setTotalPages(pagination.totalPages || 1)
        setPage(pageNum)
      } catch {
      } finally {
        setLoading(false)
      }
    },
    [isAuthenticated]
  )

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const response = await notificationApi.getUnreadCount()
      setUnreadCount(response.data.data.unreadCount || 0)
    } catch {}
  }, [isAuthenticated])

  const markAsRead = useCallback(async id => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch {}
  }, [])

  const deleteNotification = useCallback(async id => {
    try {
      await notificationApi.deleteNotification(id)
      setNotifications(prev => prev.filter(n => n._id !== id))
    } catch {}
  }, [])

  const addNotification = useCallback(notification => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  // Socket events
  useEffect(() => {
    if (!socket) return

    const handleNewNotification = ({ notification, unreadCount: count }) => {
      if (notification) addNotification(notification)
      if (count !== undefined) setUnreadCount(count)
      if (notification?.title) {
        toast(notification.title, {
          icon: notification.metadata?.icon || '🔔',
          duration: 4000
        })
      }
    }

    const handleNotificationCount = ({ unreadCount: count }) => {
      setUnreadCount(count || 0)
    }

    const handleAllRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    }

    socket.on('notification', handleNewNotification)
    socket.on('notification_count', handleNotificationCount)
    socket.on('all_notifications_read', handleAllRead)

    return () => {
      socket.off('notification', handleNewNotification)
      socket.off('notification_count', handleNotificationCount)
      socket.off('all_notifications_read', handleAllRead)
    }
  }, [socket, addNotification])

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isAuthenticated, fetchUnreadCount])

  const value = {
    notifications,
    unreadCount,
    loading,
    page,
    totalPages,
    hasMore: page < totalPages,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationContext
