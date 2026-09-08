// nestfind/nestfind/client/src/context/AIContext.jsx

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import aiApi from '../api/aiApi'
import { useAuthStore } from './AuthContext'
import toast from 'react-hot-toast'

const AIContext = createContext(null)

export const useAIStore = () => {
  const context = useContext(AIContext)
  if (!context) throw new Error('useAIStore must be used within AIProvider')
  return context
}

export const AIProvider = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const { isAuthenticated } = useAuthStore()

  // ── CHAT ──────────────────────────────────────────────────────────────────
  const openChat = useCallback(
    async (context = {}) => {
      setIsChatOpen(true)
      if (conversationId) return
      setIsLoading(true)
      try {
        const response = await aiApi.startConversation(context)
        const { conversationId: id, greeting } = response.data.data
        setConversationId(id)
        if (greeting) {
          setMessages([
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: greeting,
              timestamp: new Date()
            }
          ])
        }
      } catch (err) {
        toast.error('Failed to start AI chat')
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId]
  )

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  const sendMessage = useCallback(
    async (message, context = {}) => {
      if (!message.trim() || !isAuthenticated) return

      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])
      setIsTyping(true)

      try {
        const response = await aiApi.sendMessage({
          conversationId,
          message,
          ...context
        })

        const { response: aiResponse, suggestions } = response.data.data

        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          suggestions,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
        return { success: true, response: aiResponse, suggestions }
      } catch (err) {
        const errorMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          isError: true,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        return { success: false }
      } finally {
        setIsTyping(false)
      }
    },
    [conversationId, isAuthenticated]
  )

  const clearChat = useCallback(async () => {
    if (conversationId) {
      try {
        await aiApi.endConversation(conversationId)
      } catch {}
    }
    setConversationId(null)
    setMessages([])
  }, [conversationId])

  const addFeedback = useCallback(
    async (messageId, isHelpful, comment = '') => {
      if (!conversationId) return
      try {
        await aiApi.addFeedback(conversationId, messageId, {
          isHelpful,
          comment
        })
      } catch {}
    },
    [conversationId]
  )

  // ── RECOMMENDATIONS ────────────────────────────────────────────────────────
  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      if (!isAuthenticated) return
      setRecommendationsLoading(true)
      try {
        const response = await aiApi.getRecommendations({ forceRefresh })
        setRecommendations(response.data.data.recommendations || [])
      } catch {
      } finally {
        setRecommendationsLoading(false)
      }
    },
    [isAuthenticated]
  )

  const recordInteraction = useCallback(async (propertyId, interactionType) => {
    try {
      await aiApi.recordInteraction({ propertyId, interactionType })
    } catch {}
  }, [])

  // ── SMART SEARCH ──────────────────────────────────────────────────────────
  const performSmartSearch = useCallback(async (query, params = {}) => {
    setSearchLoading(true)
    try {
      const response = await aiApi.smartSearch({ q: query, ...params })
      setSearchResults(response.data.data)
      return { success: true, ...response.data.data }
    } catch (err) {
      return { success: false }
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const clearSearchResults = useCallback(() => {
    setSearchResults(null)
  }, [])

  const value = {
    // Chat
    isChatOpen,
    conversationId,
    messages,
    isTyping,
    isLoading,
    openChat,
    closeChat,
    sendMessage,
    clearChat,
    addFeedback,
    // Recommendations
    recommendations,
    recommendationsLoading,
    fetchRecommendations,
    recordInteraction,
    // Smart Search
    searchResults,
    searchLoading,
    performSmartSearch,
    clearSearchResults
  }

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}

export default AIContext
