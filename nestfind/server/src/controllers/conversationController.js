// nestfind/nestfind/server/src/controllers/conversationController.js

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Property = require("../models/Property");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET USER CONVERSATIONS ────────────────────────────────────────────────────
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  const conversations = await Conversation.getUserConversations(userId, role);

  return sendSuccess(res, "Conversations retrieved.", { conversations });
});

// ── GET OR CREATE CONVERSATION ────────────────────────────────────────────────
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { userId: otherUserId, propertyId } = req.body;
  const currentUserId = req.user._id;
  const currentUserRole = req.user.role;

  if (!otherUserId) return sendError(res, "User ID is required.", 400);

  if (currentUserId.toString() === otherUserId) {
    return sendError(
      res,
      "You cannot start a conversation with yourself.",
      400,
    );
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) return sendError(res, "User not found.", 404);

  // Determine tenant and landlord
  let tenantId, landlordId;
  if (currentUserRole === "tenant") {
    tenantId = currentUserId;
    landlordId = otherUserId;
  } else {
    tenantId = otherUserId;
    landlordId = currentUserId;
  }

  const conversation = await Conversation.findOrCreate(
    tenantId,
    landlordId,
    propertyId || null,
  );

  await conversation.populate([
    { path: "tenant", select: "firstName lastName avatar lastActiveAt" },
    { path: "landlord", select: "firstName lastName avatar lastActiveAt" },
    { path: "property", select: "title location coverImage" },
  ]);

  return sendSuccess(res, "Conversation retrieved.", { conversation });
});

// ── GET CONVERSATION MESSAGES ─────────────────────────────────────────────────
const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: id,
    participants: userId,
    status: "active",
  });

  if (!conversation) return sendError(res, "Conversation not found.", 404);

  const messages = await Message.getConversationMessages(
    id,
    Number(page),
    Number(limit),
  );
  const total = await Message.countDocuments({
    conversation: id,
    isDeleted: false,
  });

  // Mark messages as read
  const role =
    conversation.tenant.toString() === userId.toString()
      ? "tenant"
      : "landlord";
  await Message.markConversationAsRead(id, userId);
  await Conversation.resetUnreadCount(id, role);

  return sendPaginated(res, "Messages retrieved.", messages, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── SEND MESSAGE (HTTP fallback - WebSocket preferred) ────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, messageType = "text", propertyId } = req.body;
  const senderId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: id,
    participants: senderId,
    status: "active",
  });

  if (!conversation) return sendError(res, "Conversation not found.", 404);

  const receiverId =
    conversation.tenant.toString() === senderId.toString()
      ? conversation.landlord
      : conversation.tenant;

  const message = await Message.create({
    conversation: id,
    sender: senderId,
    receiver: receiverId,
    content: content?.trim(),
    messageType,
    sharedProperty: propertyId || null,
    status: "sent",
  });

  await message.populate("sender", "firstName lastName avatar");

  const receiverRole =
    conversation.tenant.toString() === receiverId.toString()
      ? "tenant"
      : "landlord";

  await Conversation.updateLastMessage(id, message, senderId, receiverRole);

  return sendSuccess(res, "Message sent.", { message }, 201);
});

// ── ARCHIVE CONVERSATION ──────────────────────────────────────────────────────
const archiveConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const role = req.user.role;

  const conversation = await Conversation.findOne({
    _id: id,
    participants: userId,
  });

  if (!conversation) return sendError(res, "Conversation not found.", 404);

  await conversation.archiveFor(role);

  return sendSuccess(res, "Conversation archived.");
});

// ── DELETE CONVERSATION ───────────────────────────────────────────────────────
const deleteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const role = req.user.role;

  const conversation = await Conversation.findOne({
    _id: id,
    participants: userId,
  });

  if (!conversation) return sendError(res, "Conversation not found.", 404);

  await conversation.deleteFor(role);

  return sendSuccess(res, "Conversation deleted.");
});

// ── GET UNREAD COUNT ──────────────────────────────────────────────────────────
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  const total = await Conversation.getTotalUnread(userId, role);
  const messageCount = await Message.countUnread(userId);

  return sendSuccess(res, "Unread count retrieved.", {
    conversations: total,
    messages: messageCount,
  });
});

// ── SEARCH MESSAGES ───────────────────────────────────────────────────────────
const searchMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { q } = req.query;
  const userId = req.user._id;

  if (!q || q.length < 2) return sendError(res, "Search query too short.", 400);

  const conversation = await Conversation.findOne({
    _id: id,
    participants: userId,
  });

  if (!conversation) return sendError(res, "Conversation not found.", 404);

  const messages = await Message.searchInConversation(id, q);

  return sendSuccess(res, "Search results retrieved.", { messages });
});

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  archiveConversation,
  deleteConversation,
  getUnreadCount,
  searchMessages,
};
