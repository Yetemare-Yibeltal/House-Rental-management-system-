// nestfind/nestfind/client/src/hooks/useAI.js

import { useState, useCallback, useRef } from "react";
import aiApi from "../api/aiApi";
import toast from "react-hot-toast";

export const useAI = () => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const startConversation = useCallback(async (context = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiApi.startConversation(context);
      const { conversationId: id, greeting } = response.data.data;
      setConversationId(id);
      if (greeting) {
        setMessages([
          { role: "assistant", content: greeting, id: Date.now().toString() },
        ]);
      }
      return { success: true, conversationId: id };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to start AI conversation";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (message, context = {}) => {
      if (!message.trim()) return;
      if (!conversationId) {
        await startConversation(context);
      }

      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
      setError(null);

      try {
        const response = await aiApi.sendMessage({
          conversationId,
          message,
          ...context,
        });

        const { response: aiResponse, suggestions } = response.data.data;

        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          suggestions,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        return { success: true, response: aiResponse, suggestions };
      } catch (err) {
        const message = err.response?.data?.message || "AI response failed";
        setError(message);
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setIsTyping(false);
      }
    },
    [conversationId, startConversation],
  );

  const endConversation = useCallback(async () => {
    if (!conversationId) return;
    try {
      await aiApi.endConversation(conversationId);
      setConversationId(null);
      setMessages([]);
    } catch {}
  }, [conversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const addFeedback = useCallback(
    async (messageId, isHelpful, comment = "") => {
      if (!conversationId) return;
      try {
        await aiApi.addFeedback(conversationId, messageId, {
          isHelpful,
          comment,
        });
      } catch {}
    },
    [conversationId],
  );

  const diagnoseMaintenanceIssue = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await aiApi.diagnoseMaintenance(data);
      return { success: true, ...response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const explainLease = useCallback(async (contractId, language = "en") => {
    setLoading(true);
    try {
      const response = await aiApi.explainLease(contractId, { language });
      return { success: true, ...response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getRentAdvice = useCallback(async (propertyDetails) => {
    setLoading(true);
    try {
      const response = await aiApi.getRentAdvice({ propertyDetails });
      return { success: true, ...response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const smartSearch = useCallback(async (query, params = {}) => {
    setLoading(true);
    try {
      const response = await aiApi.smartSearch({ q: query, ...params });
      return { success: true, ...response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    conversationId,
    messages,
    loading,
    isTyping,
    error,
    startConversation,
    sendMessage,
    endConversation,
    clearMessages,
    addFeedback,
    diagnoseMaintenanceIssue,
    explainLease,
    getRentAdvice,
    smartSearch,
  };
};
