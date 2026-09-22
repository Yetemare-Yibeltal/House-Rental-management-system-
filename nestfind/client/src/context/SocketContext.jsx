// nestfind/nestfind/client/src/context/SocketContext.jsx

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from './AuthContext'
import { tokenService } from '../utils/tokenService'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const socketRef = useRef(null)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    const token = tokenService.getAccessToken()
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    s.on('connect', () => {
      setIsConnected(true)
    })

    s.on('disconnect', () => {
      setIsConnected(false)
    })

    s.on('online_users', users => {
      setOnlineUsers(users)
    })

    s.on('connect_error', err => {
      console.warn('Socket connection error:', err.message)
    })

    socketRef.current = s
    setSocket(s)

    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated])

  const emit = (event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }

  const joinConversation = conversationId => {
    emit('join_conversation', { conversationId })
  }

  const leaveConversation = conversationId => {
    emit('leave_conversation', { conversationId })
  }

  const sendTyping = (conversationId, receiverId, isTyping) => {
    emit('typing', { conversationId, receiverId, isTyping })
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        emit,
        joinConversation,
        leaveConversation,
        sendTyping
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocketContext = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocketContext must be inside SocketProvider')
  return ctx
}

export default SocketContext
