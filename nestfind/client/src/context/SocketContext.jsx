// nestfind/nestfind/client/src/context/SocketContext.jsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react'
import { io } from 'socket.io-client'
import { SOCKET_URL } from '../utils/constants'
import { getAccessToken } from '../utils/tokenService'
import { useAuthStore } from './AuthContext'

const SocketContext = createContext(null)

export const useSocketStore = () => {
  const context = useContext(SocketContext)
  if (!context)
    throw new Error('useSocketStore must be used within SocketProvider')
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const { isAuthenticated } = useAuthStore()
  const socketRef = useRef(null)

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const token = getAccessToken()

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('connect_error', error => {
      console.warn('Socket connection error:', error.message)
      setIsConnected(false)
    })

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev)
        updated.delete(userId)
        return updated
      })
    })

    newSocket.on('online_statuses', statuses => {
      const onlineSet = new Set(
        Object.entries(statuses)
          .filter(([, isOnline]) => isOnline)
          .map(([userId]) => userId)
      )
      setOnlineUsers(onlineSet)
    })

    socketRef.current = newSocket
    setSocket(newSocket)
  }, [])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }
    return () => {
      disconnect()
    }
  }, [isAuthenticated, connect, disconnect])

  const value = {
    socket,
    isConnected,
    onlineUsers,
    connect,
    disconnect
  }

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  )
}

export default SocketContext
