// nestfind/nestfind/client/src/hooks/useNotifications.js

import { useState, useEffect, useCallback } from "react";
import notificationApi from "../api/notificationApi";
import { useSocketEvent } from "./useSocket";
import toast from "react-hot-toast";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(
    async (pageNum = 1, unreadOnly = false) => {
      setLoading(true);
      try {
        const response = await notificationApi.getNotifications({
          page: pageNum,
          limit: 20,
          unreadOnly,
        });
        const { data, pagination } = response.data;
        if (pageNum === 1) {
          setNotifications(data);
        } else {
          setNotifications((prev) => [...prev, ...data]);
        }
        setUnreadCount(pagination.unreadCount || 0);
        setTotalPages(pagination.totalPages || 1);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.data.data.unreadCount || 0);
    } catch {}
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error("Failed to mark all as read");
    }
  }, []);

  const archiveNotification = useCallback(async (id) => {
    try {
      await notificationApi.archiveNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  }, []);

  const loadMore = useCallback(() => {
    if (page < totalPages) {
      fetchNotifications(page + 1);
    }
  }, [page, totalPages, fetchNotifications]);

  // Real-time notifications via socket
  useSocketEvent("notification", (data) => {
    const { notification, unreadCount: count } = data;
    if (notification) {
      setNotifications((prev) => [notification, ...prev]);
    }
    if (count !== undefined) setUnreadCount(count);

    // Show toast for new notification
    if (notification) {
      toast(notification.title, {
        icon: notification.metadata?.icon || "🔔",
        duration: 4000,
      });
    }
  });

  useSocketEvent("notification_count", ({ unreadCount: count }) => {
    setUnreadCount(count || 0);
  });

  useSocketEvent("all_notifications_read", () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  });

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
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
    archiveNotification,
    deleteNotification,
    loadMore,
  };
};
