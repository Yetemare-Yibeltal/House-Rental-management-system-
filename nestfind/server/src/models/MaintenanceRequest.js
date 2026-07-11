const mongoose = require("mongoose");

const maintenanceRequestSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
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
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property reference is required"],
    },
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: [true, "Rental reference is required"],
    },

    // ── REQUEST DETAILS ───────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Issue title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Issue category is required"],
      enum: {
        values: [
          "plumbing",
          "electrical",
          "hvac",
          "structural",
          "appliance",
          "pest_control",
          "cleaning",
          "security",
          "internet",
          "painting",
          "flooring",
          "roofing",
          "window_door",
          "other",
        ],
        message: "Invalid maintenance category",
      },
    },
    urgency: {
      type: String,
      required: [true, "Urgency level is required"],
      enum: {
        values: ["low", "medium", "high", "emergency"],
        message: "Invalid urgency level",
      },
      default: "medium",
    },

    // ── PHOTOS ────────────────────────────────────────────────────────────────
    photos: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
        caption: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    completionPhotos: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
        caption: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: [
          "submitted",
          "acknowledged",
          "in_progress",
          "completed",
          "rejected",
          "cancelled",
          "pending_tenant_confirmation",
        ],
        message: "Invalid maintenance request status",
      },
      default: "submitted",
    },
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: { type: String, trim: true },
      },
    ],

    // ── LANDLORD RESPONSE ─────────────────────────────────────────────────────
    landlordResponse: {
      message: {
        type: String,
        trim: true,
        maxlength: [1000, "Response cannot exceed 1000 characters"],
      },
      respondedAt: { type: Date, default: null },
      estimatedCompletionDate: { type: Date, default: null },
      rejectionReason: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ── CONTRACTOR / REPAIR ───────────────────────────────────────────────────
    contractor: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      company: { type: String, trim: true },
      scheduledDate: { type: Date, default: null },
      scheduledTime: { type: String, trim: true },
      visitedAt: { type: Date, default: null },
    },
    repairCost: {
      type: Number,
      default: null,
      min: [0, "Repair cost cannot be negative"],
    },
    repairCostCurrency: {
      type: String,
      default: "ETB",
    },
    repairCostPaidBy: {
      type: String,
      enum: ["landlord", "tenant", "split", null],
      default: null,
    },

    // ── COMPLETION ────────────────────────────────────────────────────────────
    completedAt: { type: Date, default: null },
    completionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Completion notes cannot exceed 1000 characters"],
    },
    tenantConfirmedCompletion: {
      type: Boolean,
      default: false,
    },
    tenantConfirmedAt: {
      type: Date,
      default: null,
    },
    tenantSatisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    tenantSatisfactionComment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI diagnosis of the maintenance issue
      diagnosis: {
        type: String,
        default: null,
      },
      // AI suggested likely cause
      likelyCause: {
        type: String,
        default: null,
      },
      // AI urgency assessment (may differ from tenant's assessment)
      aiUrgencyAssessment: {
        type: String,
        enum: ["low", "medium", "high", "emergency", null],
        default: null,
      },
      // AI recommended action
      recommendedAction: {
        type: String,
        default: null,
      },
      // AI estimated repair time
      estimatedRepairTime: {
        type: String,
        default: null,
      },
      // AI suggested category (if tenant chose wrong one)
      suggestedCategory: {
        type: String,
        default: null,
      },
      // Whether AI thinks this is an emergency
      isEmergencyDetected: {
        type: Boolean,
        default: false,
      },
      // DIY fix suggestions (for low urgency issues)
      diyFixSuggestions: [{ type: String }],
      // Professional help required
      requiresProfessional: {
        type: Boolean,
        default: null,
      },
      // AI analysis timestamp
      analyzedAt: {
        type: Date,
        default: null,
      },
    },

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
    landlordNotified: {
      type: Boolean,
      default: false,
    },
    landlordNotifiedAt: {
      type: Date,
      default: null,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
maintenanceRequestSchema.index({ tenant: 1, status: 1 });
maintenanceRequestSchema.index({ landlord: 1, status: 1 });
maintenanceRequestSchema.index({ property: 1 });
maintenanceRequestSchema.index({ rental: 1 });
maintenanceRequestSchema.index({ status: 1 });
maintenanceRequestSchema.index({ urgency: 1 });
maintenanceRequestSchema.index({ category: 1 });
maintenanceRequestSchema.index({ createdAt: -1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
maintenanceRequestSchema.virtual("isOpen").get(function () {
  return !["completed", "rejected", "cancelled"].includes(this.status);
});

maintenanceRequestSchema.virtual("isEmergency").get(function () {
  return this.urgency === "emergency" || this.ai.isEmergencyDetected === true;
});

maintenanceRequestSchema.virtual("daysSinceSubmitted").get(function () {
  const diff = Date.now() - this.createdAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

maintenanceRequestSchema.virtual("isOverdue").get(function () {
  if (!this.landlordResponse.estimatedCompletionDate) return false;
  return (
    this.isOpen && new Date() > this.landlordResponse.estimatedCompletionDate
  );
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Track status history on change
maintenanceRequestSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });
    if (this.status === "completed") {
      this.completedAt = new Date();
    }
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get all open requests for a landlord
maintenanceRequestSchema.statics.getOpenForLandlord = function (landlordId) {
  return this.find({
    landlord: landlordId,
    status: { $nin: ["completed", "rejected", "cancelled"] },
  })
    .populate("tenant", "firstName lastName avatar phone")
    .populate("property", "title location")
    .sort({ urgency: -1, createdAt: -1 });
};

// Get all requests for a tenant
maintenanceRequestSchema.statics.getTenantRequests = function (
  tenantId,
  status = null,
) {
  const query = { tenant: tenantId };
  if (status) query.status = status;
  return this.find(query)
    .populate("property", "title location coverImage")
    .sort({ createdAt: -1 });
};

// Get emergency requests (for admin monitoring)
maintenanceRequestSchema.statics.getEmergencyRequests = function () {
  return this.find({
    urgency: "emergency",
    status: { $nin: ["completed", "cancelled"] },
  })
    .populate("tenant", "firstName lastName phone")
    .populate("landlord", "firstName lastName phone")
    .populate("property", "title location")
    .sort({ createdAt: -1 });
};

// Get platform maintenance statistics
maintenanceRequestSchema.statics.getPlatformStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const urgencyStats = await this.aggregate([
    {
      $group: {
        _id: "$urgency",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    byStatus: {
      submitted: 0,
      acknowledged: 0,
      in_progress: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
    },
    byUrgency: {
      low: 0,
      medium: 0,
      high: 0,
      emergency: 0,
    },
    total: 0,
  };

  stats.forEach((s) => {
    result.total += s.count;
    if (result.byStatus[s._id] !== undefined) {
      result.byStatus[s._id] = s.count;
    }
  });

  urgencyStats.forEach((s) => {
    if (result.byUrgency[s._id] !== undefined) {
      result.byUrgency[s._id] = s.count;
    }
  });

  return result;
};

// Get overdue requests (no response within 48 hours)
maintenanceRequestSchema.statics.getOverdueRequests = function () {
  const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  return this.find({
    status: "submitted",
    createdAt: { $lt: threshold },
    isEscalated: false,
  })
    .populate("tenant", "firstName lastName email phone")
    .populate("landlord", "firstName lastName email phone")
    .populate("property", "title location");
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Landlord acknowledges request
maintenanceRequestSchema.methods.acknowledge = async function (
  message,
  estimatedDate,
  acknowledgedBy,
) {
  this.status = "acknowledged";
  this.landlordResponse.message = message;
  this.landlordResponse.respondedAt = new Date();
  this.landlordResponse.estimatedCompletionDate = estimatedDate;
  this.statusHistory.push({
    status: "acknowledged",
    changedBy: acknowledgedBy,
    changedAt: new Date(),
    note: message,
  });
  return await this.save();
};

// Mark as in progress
maintenanceRequestSchema.methods.startProgress = async function (
  contractorInfo = null,
  startedBy,
) {
  this.status = "in_progress";
  if (contractorInfo)
    this.contractor = { ...this.contractor, ...contractorInfo };
  this.statusHistory.push({
    status: "in_progress",
    changedBy: startedBy,
    changedAt: new Date(),
  });
  return await this.save();
};

// Mark as completed by landlord
maintenanceRequestSchema.methods.markCompleted = async function (
  notes,
  repairCost,
  completedBy,
) {
  this.status = "pending_tenant_confirmation";
  this.completedAt = new Date();
  this.completionNotes = notes;
  if (repairCost) this.repairCost = repairCost;
  this.statusHistory.push({
    status: "pending_tenant_confirmation",
    changedBy: completedBy,
    changedAt: new Date(),
    note: notes,
  });
  return await this.save();
};

// Tenant confirms completion
maintenanceRequestSchema.methods.confirmCompletion = async function (
  rating,
  comment,
) {
  this.status = "completed";
  this.tenantConfirmedCompletion = true;
  this.tenantConfirmedAt = new Date();
  if (rating) this.tenantSatisfactionRating = rating;
  if (comment) this.tenantSatisfactionComment = comment;
  this.statusHistory.push({
    status: "completed",
    changedAt: new Date(),
  });
  return await this.save();
};

// Save AI diagnosis
maintenanceRequestSchema.methods.saveAIDiagnosis = async function (
  diagnosisData,
) {
  this.ai = {
    ...this.ai,
    ...diagnosisData,
    analyzedAt: new Date(),
  };
  return await this.save();
};

const MaintenanceRequest = mongoose.model(
  "MaintenanceRequest",
  maintenanceRequestSchema,
);

module.exports = MaintenanceRequest;
