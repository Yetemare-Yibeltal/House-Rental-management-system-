// nestfind/nestfind/client/src/context/AIContext.jsx

import { createContext, useContext } from 'react'
import { create } from 'zustand'
import aiApi from '../api/aiApi'
import toast from 'react-hot-toast'

export const useAIStore = create((set, get) => ({
  isChatOpen: false,
  messages: [],
  isTyping: false,
  isLoading: false,
  conversationId: null,
  recommendations: [],
  recommendationsLoading: false,

  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),

  clearChat: () => set({ messages: [], conversationId: null }),

  sendMessage: async content => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    set(state => ({
      messages: [...state.messages, userMessage],
      isTyping: true
    }))

    try {
      const response = await aiApi.sendChatMessage({
        message: content,
        conversationId: get().conversationId
      })

      const { message, conversationId } = response.data.data

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
        suggestions: response.data.data.suggestions || []
      }

      set(state => ({
        messages: [...state.messages, aiMessage],
        isTyping: false,
        conversationId: conversationId || state.conversationId
      }))
    } catch (err) {
      const errMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      }
      set(state => ({
        messages: [...state.messages, errMessage],
        isTyping: false
      }))
    }
  },

  addFeedback: async (messageId, isHelpful) => {
    try {
      await aiApi.submitFeedback({
        messageId,
        isHelpful,
        conversationId: get().conversationId
      })
    } catch {}
  },

  fetchRecommendations: async (force = false) => {
    if (get().recommendationsLoading) return
    set({ recommendationsLoading: true })
    try {
      const response = await aiApi.getRecommendations({ limit: 9 })
      set({ recommendations: response.data.data?.recommendations || [] })
    } catch {
      set({ recommendations: [] })
    } finally {
      set({ recommendationsLoading: false })
    }
  },

  recordInteraction: async (propertyId, type) => {
    try {
      await aiApi.recordInteraction({ propertyId, type })
    } catch {}
  },

  performSmartSearch: async query => {
    try {
      const response = await aiApi.smartSearch({ q: query })
      return response.data.data
    } catch {
      return null
    }
  }
}))

const AIContext = createContext(null)

export const AIProvider = ({ children }) => (
  <AIContext.Provider value={useAIStore()}>{children}</AIContext.Provider>
)

export default AIContext
