const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation reference is required"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender reference is required"],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver reference is required"],
    },

    // ── CONTENT ───────────────────────────────────────────────────────────────
    messageType: {
      type: String,
      enum: {
        values: [
          "text",
          "image",
          "document",
          "property_share",
          "system",
          "ai_suggestion",
        ],
        message: "Invalid message type",
      },
      default: "text",
    },
    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },

    // ── ATTACHMENTS ───────────────────────────────────────────────────────────
    attachments: [
      {
        public_id: { type: String },
        url: { type: String },
        filename: { type: String, trim: true },
        fileType: { type: String, trim: true },
        fileSize: { type: Number },
        mimeType: { type: String, trim: true },
      },
    ],

    // ── PROPERTY SHARE ────────────────────────────────────────────────────────
    // When user shares a property listing in chat
    sharedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },

    // ── EDIT / DELETE ─────────────────────────────────────────────────────────
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    originalContent: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── REPLY ─────────────────────────────────────────────────────────────────
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // Whether this message was generated/suggested by AI
      isAIGenerated: {
        type: Boolean,
        default: false,
      },
      // AI suggested reply for the receiver
      suggestedReply: {
        type: String,
        default: null,
      },
      // Sentiment analysis of message
      sentiment: {
        type: String,
        enum: ["positive", "neutral", "negative", null],
        default: null,
      },
      // Whether message contains inappropriate content
      isFlagged: {
        type: Boolean,
        default: false,
      },
      flagReason: {
        type: String,
        default: null,
      },
    },

    // ── METADATA ──────────────────────────────────────────────────────────────
    platform: {
      type: String,
      enum: ["web", "mobile", "desktop"],
      default: "web",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isDeleted: 1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
messageSchema.virtual("isTextMessage").get(function () {
  return this.messageType === "text";
});

messageSchema.virtual("hasAttachments").get(function () {
  return this.attachments && this.attachments.length > 0;
});

messageSchema.virtual("preview").get(function () {
  if (this.isDeleted) return "This message was deleted";
  if (this.messageType === "image") return "📷 Image";
  if (this.messageType === "document") return "📄 Document";
  if (this.messageType === "property_share") return "🏠 Shared a property";
  if (this.content) {
    return this.content.length > 60
      ? this.content.substring(0, 60) + "..."
      : this.content;
  }
  return "";
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Store original content before editing
messageSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    if (!this.originalContent) {
      this.originalContent = this.content;
    }
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get messages for a conversation with pagination
messageSchema.statics.getConversationMessages = function (
  conversationId,
  page = 1,
  limit = 50,
) {
  const skip = (page - 1) * limit;
  return this.find({
    conversation: conversationId,
    isDeleted: false,
  })
    .populate("sender", "firstName lastName avatar")
    .populate("replyTo", "content sender messageType")
    .populate("sharedProperty", "title location coverImage pricing")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Mark all messages in conversation as read
messageSchema.statics.markConversationAsRead = async function (
  conversationId,
  userId,
) {
  return await this.updateMany(
    {
      conversation: conversationId,
      receiver: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
      status: "read",
    },
  );
};

// Count unread messages for a user
messageSchema.statics.countUnread = async function (userId) {
  return await this.countDocuments({
    receiver: userId,
    isRead: false,
    isDeleted: false,
  });
};

// Get unread message count per conversation for a user
messageSchema.statics.getUnreadCountByConversation = async function (userId) {
  return await this.aggregate([
    {
      $match: {
        receiver: new mongoose.Types.ObjectId(userId),
        isRead: false,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$conversation",
        count: { $sum: 1 },
        lastMessage: { $last: "$content" },
        lastMessageAt: { $last: "$createdAt" },
      },
    },
  ]);
};

// Search messages in a conversation
messageSchema.statics.searchInConversation = function (
  conversationId,
  searchQuery,
) {
  return this.find({
    conversation: conversationId,
    isDeleted: false,
    content: { $regex: searchQuery, $options: "i" },
  })
    .populate("sender", "firstName lastName avatar")
    .sort({ createdAt: -1 })
    .limit(20);
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Mark message as read
messageSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    this.status = "read";
    await this.save();
  }
};

// Soft delete message
messageSchema.methods.softDelete = async function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.content = null;
  this.attachments = [];
  await this.save();
};

// Mark as delivered
messageSchema.methods.markDelivered = async function () {
  if (this.status === "sent") {
    this.status = "delivered";
    this.deliveredAt = new Date();
    await this.save();
  }
};

// ── QUERY MIDDLEWARE ──────────────────────────────────────────────────────────
messageSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
