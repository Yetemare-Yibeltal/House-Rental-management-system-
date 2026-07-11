const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // ── PARTICIPANTS ──────────────────────────────────────────────────────────
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant reference is required"],
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Landlord reference is required"],
    },

    // ── PROPERTY CONTEXT ──────────────────────────────────────────────────────
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    // ── PARTICIPANTS ARRAY (for easy querying) ────────────────────────────────
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ── LAST MESSAGE PREVIEW ──────────────────────────────────────────────────
    lastMessage: {
      content: { type: String, trim: true },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      messageType: {
        type: String,
        enum: [
          "text",
          "image",
          "document",
          "property_share",
          "system",
          "ai_suggestion",
        ],
        default: "text",
      },
      sentAt: { type: Date },
      isRead: { type: Boolean, default: false },
    },

    // ── UNREAD COUNTS ─────────────────────────────────────────────────────────
    unreadCount: {
      tenant: { type: Number, default: 0 },
      landlord: { type: Number, default: 0 },
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "archived", "blocked", "deleted"],
      default: "active",
    },

    // ── VISIBILITY (per participant) ──────────────────────────────────────────
    // Allows one party to archive/hide without affecting other party
    tenantArchived: {
      type: Boolean,
      default: false,
    },
    landlordArchived: {
      type: Boolean,
      default: false,
    },
    tenantDeleted: {
      type: Boolean,
      default: false,
    },
    landlordDeleted: {
      type: Boolean,
      default: false,
    },

    // ── BLOCKING ──────────────────────────────────────────────────────────────
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    blockedAt: {
      type: Date,
      default: null,
    },

    // ── MESSAGE STATS ─────────────────────────────────────────────────────────
    totalMessages: {
      type: Number,
      default: 0,
    },
    firstMessageAt: {
      type: Date,
      default: null,
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI conversation summary (for long conversations)
      conversationSummary: {
        type: String,
        default: null,
      },
      summaryGeneratedAt: {
        type: Date,
        default: null,
      },
      // AI detected conversation sentiment
      overallSentiment: {
        type: String,
        enum: ["positive", "neutral", "negative", null],
        default: null,
      },
      // Whether conversation has been flagged for review
      isFlagged: {
        type: Boolean,
        default: false,
      },
      flagReason: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
conversationSchema.index(
  { tenant: 1, landlord: 1, property: 1 },
  { unique: true },
);
conversationSchema.index({ participants: 1 });
conversationSchema.index({ tenant: 1, status: 1 });
conversationSchema.index({ landlord: 1, status: 1 });
conversationSchema.index({ "lastMessage.sentAt": -1 });
conversationSchema.index({ updatedAt: -1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
conversationSchema.virtual("messages", {
  ref: "Message",
  localField: "_id",
  foreignField: "conversation",
});

conversationSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Auto-populate participants array from tenant and landlord
conversationSchema.pre("save", function (next) {
  if (this.isNew) {
    this.participants = [this.tenant, this.landlord];
    this.firstMessageAt = new Date();
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Find or create conversation between two users about a property
conversationSchema.statics.findOrCreate = async function (
  tenantId,
  landlordId,
  propertyId = null,
) {
  let conversation = await this.findOne({
    tenant: tenantId,
    landlord: landlordId,
    ...(propertyId && { property: propertyId }),
  });

  if (!conversation) {
    conversation = await this.create({
      tenant: tenantId,
      landlord: landlordId,
      property: propertyId,
      participants: [tenantId, landlordId],
    });
  }

  return conversation;
};

// Get all conversations for a user
conversationSchema.statics.getUserConversations = function (userId, role) {
  const query = { status: "active" };

  if (role === "tenant") {
    query.tenant = userId;
    query.tenantDeleted = false;
  } else if (role === "landlord") {
    query.landlord = userId;
    query.landlordDeleted = false;
  } else {
    query.participants = userId;
  }

  return this.find(query)
    .populate("tenant", "firstName lastName avatar lastActiveAt")
    .populate("landlord", "firstName lastName avatar lastActiveAt")
    .populate("property", "title location coverImage")
    .populate("lastMessage.sender", "firstName lastName")
    .sort({ "lastMessage.sentAt": -1 });
};

// Update last message after new message is sent
conversationSchema.statics.updateLastMessage = async function (
  conversationId,
  message,
  senderId,
  receiverRole,
) {
  const update = {
    "lastMessage.content": message.preview || message.content,
    "lastMessage.sender": senderId,
    "lastMessage.messageType": message.messageType,
    "lastMessage.sentAt": new Date(),
    "lastMessage.isRead": false,
    $inc: {
      totalMessages: 1,
      [`unreadCount.${receiverRole}`]: 1,
    },
  };

  return await this.findByIdAndUpdate(conversationId, update, { new: true });
};

// Reset unread count for a participant
conversationSchema.statics.resetUnreadCount = async function (
  conversationId,
  role,
) {
  return await this.findByIdAndUpdate(
    conversationId,
    { [`unreadCount.${role}`]: 0 },
    { new: true },
  );
};

// Get total unread conversations count for a user
conversationSchema.statics.getTotalUnread = async function (userId, role) {
  const field = `unreadCount.${role}`;
  const match = {
    [`${role}`]: new mongoose.Types.ObjectId(userId),
    status: "active",
  };

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalUnread: { $sum: `$${field}` },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalUnread : 0;
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Archive conversation for a specific user
conversationSchema.methods.archiveFor = async function (role) {
  if (role === "tenant") this.tenantArchived = true;
  if (role === "landlord") this.landlordArchived = true;
  return await this.save();
};

// Delete conversation for a specific user
conversationSchema.methods.deleteFor = async function (role) {
  if (role === "tenant") this.tenantDeleted = true;
  if (role === "landlord") this.landlordDeleted = true;

  // If both deleted, mark as deleted
  if (this.tenantDeleted && this.landlordDeleted) {
    this.status = "deleted";
  }

  return await this.save();
};

// Block conversation
conversationSchema.methods.block = async function (blockedByUserId) {
  this.status = "blocked";
  this.blockedBy = blockedByUserId;
  this.blockedAt = new Date();
  return await this.save();
};

// Unblock conversation
conversationSchema.methods.unblock = async function () {
  this.status = "active";
  this.blockedBy = null;
  this.blockedAt = null;
  return await this.save();
};

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
