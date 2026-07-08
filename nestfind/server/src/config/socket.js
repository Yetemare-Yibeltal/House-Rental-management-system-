const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

let io;

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // ── AUTH MIDDLEWARE ─────────────────────────────────────────────────────
  // Every socket connection must provide a valid JWT token
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication required: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userName = decoded.name;
      next();
    } catch (error) {
      logger.warn(`Socket auth failed: ${error.message}`);
      next(new Error("Authentication failed: Invalid or expired token"));
    }
  });

  // ── CONNECTION HANDLER ──────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: userId=${userId} socketId=${socket.id}`);

    // Add user to online users map
    onlineUsers.set(userId, socket.id);

    // Join personal room (for targeted notifications)
    socket.join(`user:${userId}`);

    // Join role-based room (for broadcasts by role)
    socket.join(`role:${socket.userRole}`);

    // Notify others that this user is now online
    socket.broadcast.emit("user:online", { userId });

    // ── JOIN CONVERSATION ROOM ──────────────────────────────────────────
    socket.on("conversation:join", (conversationId) => {
      if (!conversationId) return;
      socket.join(`conversation:${conversationId}`);
      logger.info(`User ${userId} joined conversation:${conversationId}`);
    });

    // ── LEAVE CONVERSATION ROOM ─────────────────────────────────────────
    socket.on("conversation:leave", (conversationId) => {
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
      logger.info(`User ${userId} left conversation:${conversationId}`);
    });

    // ── TYPING INDICATOR ────────────────────────────────────────────────
    socket.on("typing:start", ({ conversationId, recipientId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("typing:start", {
        userId,
        conversationId,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("typing:stop", {
        userId,
        conversationId,
      });
    });

    // ── MESSAGE DELIVERED ACKNOWLEDGEMENT ───────────────────────────────
    socket.on("message:delivered", ({ messageId, conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("message:delivered", {
        messageId,
        deliveredAt: new Date(),
      });
    });

    // ── MESSAGE READ ACKNOWLEDGEMENT ────────────────────────────────────
    socket.on("message:read", ({ messageId, conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("message:read", {
        messageId,
        readAt: new Date(),
        readBy: userId,
      });
    });

    // ── PING / HEARTBEAT ────────────────────────────────────────────────
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date() });
    });

    // ── DISCONNECT ──────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      onlineUsers.delete(userId);
      socket.broadcast.emit("user:offline", {
        userId,
        lastSeen: new Date(),
      });
      logger.info(`Socket disconnected: userId=${userId} reason=${reason}`);
    });

    // ── ERROR ───────────────────────────────────────────────────────────
    socket.on("error", (error) => {
      logger.error(`Socket error for userId=${userId}: ${error.message}`);
    });
  });

  logger.info("Socket.io initialized");
  return io;
};

// ── EMIT HELPERS ────────────────────────────────────────────────────────────
// Used by controllers/services to push events to specific users

// Send to a specific user by their userId
const emitToUser = (userId, event, data) => {
  if (!io) {
    logger.warn("Socket.io not initialized — cannot emit to user");
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
};

// Send to all users with a specific role
const emitToRole = (role, event, data) => {
  if (!io) {
    logger.warn("Socket.io not initialized — cannot emit to role");
    return;
  }
  io.to(`role:${role}`).emit(event, data);
};

// Send to all users in a conversation
const emitToConversation = (conversationId, event, data) => {
  if (!io) {
    logger.warn("Socket.io not initialized — cannot emit to conversation");
    return;
  }
  io.to(`conversation:${conversationId}`).emit(event, data);
};

// Broadcast to every connected socket
const emitToAll = (event, data) => {
  if (!io) {
    logger.warn("Socket.io not initialized — cannot broadcast");
    return;
  }
  io.emit(event, data);
};

// Check if a specific user is currently online
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

// Get list of all currently online user IDs
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

// Get the io instance (used in routes/controllers if needed)
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
};

module.exports = {
  initializeSocket,
  emitToUser,
  emitToRole,
  emitToConversation,
  emitToAll,
  isUserOnline,
  getOnlineUsers,
  getIO,
};
