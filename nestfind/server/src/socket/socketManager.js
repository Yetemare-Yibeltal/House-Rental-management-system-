// nestfind/nestfind/server/src/socket/socketManager.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");
const messageHandler = require("./messageHandler");
const notificationHandler = require("./notificationHandler");

// ── CONNECTED USERS MAP ───────────────────────────────────────────────────────
// Maps userId -> Set of socket IDs (user can have multiple connections)
const connectedUsers = new Map();

// ── SOCKET AUTHENTICATION ─────────────────────────────────────────────────────

/**
 * Authenticate socket connection using JWT token.
 * Token can be sent in handshake auth or query params.
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
      socket.handshake.query?.token;

    if (!token) {
      // Allow unauthenticated connections for public features
      socket.userId = null;
      socket.userRole = "guest";
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "firstName lastName role status avatar",
    );

    if (!user || user.status !== "active") {
      socket.userId = null;
      socket.userRole = "guest";
      return next();
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.userName = `${user.firstName} ${user.lastName}`;
    socket.user = user;

    next();
  } catch (error) {
    // Invalid token — allow as guest
    socket.userId = null;
    socket.userRole = "guest";
    next();
  }
};

// ── INITIALIZE SOCKET MANAGER ─────────────────────────────────────────────────

/**
 * Initialize all Socket.io event handlers.
 * Called once when the server starts.
 *
 * @param {Object} io - Socket.io server instance
 */
const initializeSocketManager = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const userId = socket.userId;
    const role = socket.userRole;

    logger.info(
      `Socket connected: id=${socket.id}, userId=${userId || "guest"}, role=${role}`,
    );

    // ── JOIN USER ROOM ────────────────────────────────────────────────────────
    if (userId) {
      // Join user-specific room for targeted notifications
      socket.join(`user_${userId}`);

      // Join role-specific room for broadcasts
      socket.join(`role_${role}`);

      // Track connected users
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId).add(socket.id);

      // Update user's last active timestamp
      User.findByIdAndUpdate(userId, { lastActiveAt: new Date() }).catch(
        () => {},
      );

      // Notify user they are connected
      socket.emit("connected", {
        userId,
        role,
        message: "Connected to NestFind real-time server",
        timestamp: new Date().toISOString(),
      });

      logger.info(`User joined rooms: user_${userId}, role_${role}`);
    }

    // ── CONVERSATION ROOM ─────────────────────────────────────────────────────
    socket.on("join_conversation", (conversationId) => {
      if (!userId) return;
      socket.join(`conversation_${conversationId}`);
      logger.debug(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // ── TYPING INDICATORS ─────────────────────────────────────────────────────
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId) return;
      io.to(`user_${receiverId}`).emit("user_typing", {
        userId,
        userName: socket.userName,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId) return;
      io.to(`user_${receiverId}`).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    // ── MESSAGE EVENTS ────────────────────────────────────────────────────────
    socket.on("send_message", async (data) => {
      await messageHandler.handleSendMessage(io, socket, data);
    });

    socket.on("mark_messages_read", async (data) => {
      await messageHandler.handleMarkMessagesRead(io, socket, data);
    });

    socket.on("delete_message", async (data) => {
      await messageHandler.handleDeleteMessage(io, socket, data);
    });

    // ── NOTIFICATION EVENTS ───────────────────────────────────────────────────
    socket.on("mark_notification_read", async (data) => {
      await notificationHandler.handleMarkRead(io, socket, data);
    });

    socket.on("mark_all_notifications_read", async () => {
      await notificationHandler.handleMarkAllRead(io, socket);
    });

    // ── ONLINE STATUS ─────────────────────────────────────────────────────────
    socket.on("get_online_status", ({ userIds }) => {
      if (!userId || !Array.isArray(userIds)) return;

      const statuses = {};
      userIds.forEach((id) => {
        statuses[id] = connectedUsers.has(id);
      });

      socket.emit("online_statuses", statuses);
    });

    // ── AI CHAT EVENTS ────────────────────────────────────────────────────────
    socket.on("ai_chat_message", async (data) => {
      if (!userId) {
        socket.emit("ai_error", { message: "Authentication required" });
        return;
      }
      // AI chat is handled via HTTP streaming, not WebSocket
      // This event is for UI state coordination only
      socket.emit("ai_typing", { isTyping: true });
    });

    // ── PROPERTY EVENTS ───────────────────────────────────────────────────────
    socket.on("join_property_room", (propertyId) => {
      // Allow viewing property updates in real-time
      socket.join(`property_${propertyId}`);
    });

    // ── PING/PONG ─────────────────────────────────────────────────────────────
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      if (userId) {
        const userSockets = connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            connectedUsers.delete(userId);
            // Broadcast offline status to relevant users
            io.emit("user_offline", { userId, timestamp: new Date() });
          }
        }
      }

      logger.info(
        `Socket disconnected: id=${socket.id}, userId=${userId || "guest"}, reason=${reason}`,
      );
    });

    // ── ERROR HANDLING ────────────────────────────────────────────────────────
    socket.on("error", (error) => {
      logger.error(`Socket error: id=${socket.id}, error=${error.message}`);
    });
  });

  logger.info("Socket.io event handlers initialized");
};

// ── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Check if a user is currently online.
 *
 * @param {string} userId - User ID
 * @returns {boolean} - true if online
 */
const isUserOnline = (userId) => {
  return connectedUsers.has(userId.toString());
};

/**
 * Get count of online users.
 *
 * @returns {number} - Online user count
 */
const getOnlineUserCount = () => {
  return connectedUsers.size;
};

/**
 * Get all online user IDs.
 *
 * @returns {Array} - Array of online user IDs
 */
const getOnlineUsers = () => {
  return Array.from(connectedUsers.keys());
};

/**
 * Send a real-time event to a specific user.
 *
 * @param {Object} io - Socket.io instance
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

/**
 * Send a real-time event to all users with a specific role.
 *
 * @param {Object} io - Socket.io instance
 * @param {string} role - Target role
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToRole = (io, role, event, data) => {
  io.to(`role_${role}`).emit(event, data);
};

/**
 * Send a real-time event to all connected users.
 *
 * @param {Object} io - Socket.io instance
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToAll = (io, event, data) => {
  io.emit(event, data);
};

/**
 * Send a real-time event to all users in a conversation.
 *
 * @param {Object} io - Socket.io instance
 * @param {string} conversationId - Conversation ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToConversation = (io, conversationId, event, data) => {
  io.to(`conversation_${conversationId}`).emit(event, data);
};

module.exports = {
  initializeSocketManager,
  isUserOnline,
  getOnlineUserCount,
  getOnlineUsers,
  emitToUser,
  emitToRole,
  emitToAll,
  emitToConversation,
  connectedUsers,
};
