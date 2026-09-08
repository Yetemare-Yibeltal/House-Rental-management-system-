// nestfind/nestfind/client/src/hooks/useSocket.js

import { useEffect, useCallback, useRef } from "react";
import { useSocketStore } from "../context/SocketContext";

export const useSocket = () => {
  const { socket, isConnected, onlineUsers } = useSocketStore();

  const emit = useCallback(
    (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      }
    },
    [socket, isConnected],
  );

  const on = useCallback(
    (event, handler) => {
      if (socket) {
        socket.on(event, handler);
        return () => socket.off(event, handler);
      }
      return () => {};
    },
    [socket],
  );

  const off = useCallback(
    (event, handler) => {
      if (socket) socket.off(event, handler);
    },
    [socket],
  );

  const joinConversation = useCallback(
    (conversationId) => {
      emit("join_conversation", conversationId);
    },
    [emit],
  );

  const leaveConversation = useCallback(
    (conversationId) => {
      emit("leave_conversation", conversationId);
    },
    [emit],
  );

  const sendTyping = useCallback(
    (conversationId, receiverId, isTyping) => {
      emit(isTyping ? "typing_start" : "typing_stop", {
        conversationId,
        receiverId,
      });
    },
    [emit],
  );

  const joinPropertyRoom = useCallback(
    (propertyId) => {
      emit("join_property_room", propertyId);
    },
    [emit],
  );

  const getOnlineStatus = useCallback(
    (userIds) => {
      emit("get_online_status", { userIds });
    },
    [emit],
  );

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers],
  );

  return {
    socket,
    isConnected,
    emit,
    on,
    off,
    joinConversation,
    leaveConversation,
    sendTyping,
    joinPropertyRoom,
    getOnlineStatus,
    isUserOnline,
    onlineUsers,
  };
};

export const useSocketEvent = (event, handler, deps = []) => {
  const { socket } = useSocketStore();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket || !event) return;
    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event, ...deps]);
};
