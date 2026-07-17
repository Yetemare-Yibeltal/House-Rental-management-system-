// nestfind/nestfind/server/src/socket/messageHandler.js

const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const notificationService = require("../services/notificationService");
const logger = require("../utils/logger");

/**
 * Handle sending a new message via Socket.io.
 *
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Connected socket
 * @param {Object} data - Message data from client
 */
const handleSendMessage = async (io, socket, data) => {
  try {
    const senderId = socket.userId;

    if (!senderId) {
      socket.emit("message_error", {
        error: "Authentication required to send messages",
      });
      return;
    }

    const {
      conversationId,
      receiverId,
      content,
      messageType = "text",
      propertyId = null,
      replyToId = null,
    } = data;

    // Validate required fields
    if (!conversationId || !receiverId) {
      socket.emit("message_error", {
        error: "Conversation ID and receiver ID are required",
      });
      return;
    }

    if (messageType === "text" && (!content || content.trim().length === 0)) {
      socket.emit("message_error", {
        error: "Message content cannot be empty",
      });
      return;
    }

    // Find or verify conversation exists
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
      status: "active",
    });

    if (!conversation) {
      socket.emit("message_error", {
        error: "Conversation not found or not active",
      });
      return;
    }

    // Determine receiver role
    const receiverRole =
      conversation.tenant.toString() === receiverId ? "tenant" : "landlord";
    const senderRole =
      conversation.tenant.toString() === senderId ? "tenant" : "landlord";

    // Create message in database
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      receiver: receiverId,
      content: content?.trim(),
      messageType,
      status: "sent",
      sharedProperty: propertyId || null,
      replyTo: replyToId || null,
      platform: "web",
    });

    // Populate sender info for response
    await message.populate("sender", "firstName lastName avatar");
    if (replyToId) {
      await message.populate("replyTo", "content sender messageType");
    }
    if (propertyId) {
      await message.populate(
        "sharedProperty",
        "title location coverImage pricing",
      );
    }

    // Update conversation last message
    await Conversation.updateLastMessage(
      conversationId,
      message,
      senderId,
      receiverRole,
    );

    // Emit message to conversation room (both participants see it)
    io.to(`conversation_${conversationId}`).emit("new_message", {
      message,
      conversationId,
    });

    // Also emit to receiver's personal room (for notification badge)
    io.to(`user_${receiverId}`).emit("message_received", {
      conversationId,
      senderId,
      senderName: socket.userName,
      preview: message.preview,
      timestamp: message.createdAt,
    });

    // Mark as delivered if receiver is online
    const { isUserOnline } = require("./socketManager");
    if (isUserOnline(receiverId)) {
      await message.markDelivered();
      socket.emit("message_delivered", {
        messageId: message._id,
        conversationId,
      });
    }

    // Send notification to receiver
    await notificationService.sendNotification({
      recipientId: receiverId,
      senderId,
      type: "new_message",
      data: {
        senderName: socket.userName,
        messagePreview:
          message.preview ||
          (content ? content.substring(0, 80) : "Sent a message"),
      },
      channels: { inApp: true },
      resourceType: "Conversation",
      resourceId: conversationId,
    });

    logger.info(
      `Message sent: from=${senderId}, to=${receiverId}, conv=${conversationId}`,
    );
  } catch (error) {
    logger.error(`Message send error: ${error.message}`);
    socket.emit("message_error", {
      error: "Failed to send message. Please try again.",
    });
  }
};

/**
 * Handle marking messages as read.
 *
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Connected socket
 * @param {Object} data - { conversationId }
 */
const handleMarkMessagesRead = async (io, socket, data) => {
  try {
    const userId = socket.userId;
    if (!userId) return;

    const { conversationId } = data;
    if (!conversationId) return;

    // Mark all messages in conversation as read
    await Message.markConversationAsRead(conversationId, userId);

    // Reset unread count in conversation
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      const role =
        conversation.tenant.toString() === userId ? "tenant" : "landlord";
      await Conversation.resetUnreadCount(conversationId, role);

      // Notify the sender that messages were read
      const otherUserId =
        role === "tenant"
          ? conversation.landlord.toString()
          : conversation.tenant.toString();

      io.to(`user_${otherUserId}`).emit("messages_read", {
        conversationId,
        readBy: userId,
        readAt: new Date(),
      });
    }
  } catch (error) {
    logger.error(`Mark read error: ${error.message}`);
  }
};

/**
 * Handle deleting a message.
 *
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Connected socket
 * @param {Object} data - { messageId, conversationId }
 */
const handleDeleteMessage = async (io, socket, data) => {
  try {
    const userId = socket.userId;
    if (!userId) return;

    const { messageId, conversationId } = data;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      socket.emit("message_error", {
        error: "Message not found or you cannot delete it",
      });
      return;
    }

    // Only allow deletion within 10 minutes
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > tenMinutes) {
      socket.emit("message_error", {
        error: "Messages can only be deleted within 10 minutes of sending",
      });
      return;
    }

    await message.softDelete(userId);

    // Notify both participants of deletion
    io.to(`conversation_${conversationId}`).emit("message_deleted", {
      messageId,
      conversationId,
      deletedBy: userId,
    });
  } catch (error) {
    logger.error(`Message delete error: ${error.message}`);
    socket.emit("message_error", { error: "Failed to delete message" });
  }
};

module.exports = {
  handleSendMessage,
  handleMarkMessagesRead,
  handleDeleteMessage,
};
