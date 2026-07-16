// nestfind/nestfind/server/src/services/notificationService.js

const Notification = require('../models/Notification');
const emailService = require('./emailService');
const smsService = require('./smsService');
const logger = require('../utils/logger');

// ── GET SOCKET IO ──────────────────────────────────────────────────────────────
const getIO = () => {
  try {
    return require('../config/socket').getIO();
  } catch {
    return null;
  }
};

// ── CORE NOTIFICATION CREATOR ─────────────────────────────────────────────────

/**
 * Create and deliver a notification to a user.
 * Handles in-app, email, and SMS delivery based on user preferences.
 *
 * @param {Object} params - Notification parameters
 * @returns {Object} - Created notification
 */
const createAndSendNotification = async ({
  recipientId,
  senderId = null,
  type,
  title,
  message,
  actionUrl = null,
  actionLabel = null,
  resourceType = null,
  resourceId = null,
  priority = 'normal',
  channels = { inApp: true, email: false, sms: false },
  metadata = {},
  emailData = null,
}) => {
  try {
    // Create in-app notification record
    const notification = await Notification.createNotification({
      recipientId,
      senderId,
      type,
      title,
      message,
      actionUrl,
      actionLabel,
      resourceType,
      resourceId,
      priority,
      channels,
      metadata,
    });

    // Send real-time notification via Socket.io
    if (channels.inApp) {
      const io = getIO();
      if (io) {
        io.to(`user:${recipientId}`).emit('notification', {
          id: notification._id,
          type,
          title,
          message,
          actionUrl,
          priority,
          createdAt: notification.createdAt,
        });
      }
    }

    // Send email notification
    if (channels.email && emailData) {
      try {
        if (emailData.type === 'otp') {
          await emailService.sendOTPEmail(
            emailData.email,
            emailData.firstName,
            emailData.otp,
            emailData.purpose,
            emailData.expiryMinutes
          );
        } else if (emailData.type === 'booking_confirmation') {
          await emailService.sendBookingConfirmationEmail(
            emailData.email,
            emailData.firstName,
            emailData.bookingDetails
          );
        } else if (emailData.type === 'booking_approval') {
          await emailService.sendBookingApprovalEmail(
            emailData.email,
            emailData.firstName,
            emailData.bookingDetails
          );
        } else if (emailData.type === 'payment_receipt') {
          await emailService.sendPaymentReceiptEmail(
            emailData.email,
            emailData.firstName,
            emailData.paymentDetails
          );
        }

        await Notification.findByIdAndUpdate(notification._id, {
          emailSent: true,
          emailSentAt: new Date(),
        });
      } catch (emailError) {
        logger.error(`Email notification failed: ${emailError.message}`);
      }
    }

    // Send SMS notification
    if (channels.sms && metadata.phone) {
      try {
        await smsService.sendSMS(metadata.phone, message);
        await Notification.findByIdAndUpdate(notification._id, {
          smsSent: true,
          smsSentAt: new Date(),
        });
      } catch (smsError) {
        logger.error(`SMS notification failed: ${smsError.message}`);
      }
    }

    return { success: true, notification };
  } catch (error) {
    logger.error(`Notification creation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── BOOKING NOTIFICATIONS ─────────────────────────────────────────────────────

const notifyBookingReceived = async (booking, tenant, landlord, property) => {
  return createAndSendNotification({
    recipientId: landlord._id,
    senderId: tenant._id,
    type: 'booking_received',
    title: 'New Visit Request',
    message: `${tenant.firstName} ${tenant.lastName} wants to visit "${property.title}"`,
    actionUrl: `/landlord/bookings`,
    actionLabel: 'Review Request',
    resourceType: 'Booking',
    resourceId: booking._id,
    priority: 'high',
  });
};

const notifyBookingApproved = async (booking, tenant, landlord, property) => {
  return createAndSendNotification({
    recipientId: tenant._id,
    senderId: landlord._id,
    type: 'booking_approved',
    title: 'Visit Approved! 🎉',
    message: `Your visit to "${property.title}" is confirmed for ${new Date(booking.confirmedDate).toLocaleDateString()}`,
    actionUrl: `/tenant/bookings`,
    actionLabel: 'View Details',
    resourceType: 'Booking',
    resourceId: booking._id,
    priority: 'high',
    channels: { inApp: true, email: true },
    emailData: {
      type: 'booking_approval',
      email: tenant.email,
      firstName: tenant.firstName,
      bookingDetails: {
        propertyTitle: property.title,
        location: `${property.location?.subCity}, ${property.location?.city}`,
        confirmedDate: new Date(booking.confirmedDate).toLocaleDateString(),
        confirmedTime: booking.confirmedTime,
        landlordName: `${landlord.firstName} ${landlord.lastName}`,
        landlordPhone: landlord.phone,
        landlordResponse: booking.landlordResponse,
      },
    },
  });
};

const notifyBookingDeclined = async (booking, tenant, property) => {
  return createAndSendNotification({
    recipientId: tenant._id,
    type: 'booking_declined',
    title: 'Visit Request Declined',
    message: `Your visit request for "${property.title}" was not approved.`,
    actionUrl: `/listings`,
    actionLabel: 'Browse Properties',
    resourceType: 'Booking',
    resourceId: booking._id,
    priority: 'normal',
  });
};

// ── PAYMENT NOTIFICATIONS ─────────────────────────────────────────────────────

const notifyPaymentReceived = async (payment, tenant, landlord, property) => {
  // Notify landlord
  await createAndSendNotification({
    recipientId: landlord._id,
    senderId: tenant._id,
    type: 'payment_received',
    title: 'Rent Payment Received 💰',
    message: `ETB ${payment.netAmount?.toLocaleString()} rent payment received from ${tenant.firstName} for "${property.title}"`,
    actionUrl: `/landlord/payments`,
    actionLabel: 'View Payment',
    resourceType: 'Payment',
    resourceId: payment._id,
    priority: 'high',
  });

  // Notify tenant with receipt
  return createAndSendNotification({
    recipientId: tenant._id,
    type: 'payment_received',
    title: 'Payment Confirmed ✅',
    message: `Your rent payment of ETB ${payment.amount?.toLocaleString()} has been confirmed. Receipt: ${payment.receiptNumber}`,
    actionUrl: `/tenant/payments`,
    actionLabel: 'View Receipt',
    resourceType: 'Payment',
    resourceId: payment._id,
    priority: 'high',
    channels: { inApp: true, email: true },
    emailData: {
      type: 'payment_receipt',
      email: tenant.email,
      firstName: tenant.firstName,
      paymentDetails: {
        amount: payment.amount,
        receiptNumber: payment.receiptNumber,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        propertyTitle: property.title,
        periodLabel: payment.paymentPeriod?.periodLabel,
        transactionId: payment.transactionId,
      },
    },
  });
};

const notifyPaymentDue = async (rental, tenant, property) => {
  return createAndSendNotification({
    recipientId: tenant._id,
    type: 'payment_due',
    title: 'Rent Payment Due',
    message: `Your rent of ETB ${rental.monthlyRent?.toLocaleString()} for "${property.title}" is due on ${new Date(rental.nextPaymentDue).toLocaleDateString()}`,
    actionUrl: `/tenant/payments/make`,
    actionLabel: 'Pay Now',
    resourceType: 'Rental',
    resourceId: rental._id,
    priority: 'high',
  });
};

// ── MAINTENANCE NOTIFICATIONS ─────────────────────────────────────────────────

const notifyMaintenanceSubmitted = async (request, tenant, landlord, property) => {
  return createAndSendNotification({
    recipientId: landlord._id,
    senderId: tenant._id,
    type: 'maintenance_submitted',
    title: 'New Maintenance Request',
    message: `${tenant.firstName} submitted a ${request.urgency} priority maintenance request: "${request.title}"`,
    actionUrl: `/landlord/maintenance`,
    actionLabel: 'View Request',
    resourceType: 'MaintenanceRequest',
    resourceId: request._id,
    priority: request.urgency === 'emergency' ? 'urgent' : 'high',
  });
};

const notifyMaintenanceAcknowledged = async (request, tenant, property) => {
  return createAndSendNotification({
    recipientId: tenant._id,
    type: 'maintenance_acknowledged',
    title: 'Maintenance Request Acknowledged',
    message: `Your maintenance request "${request.title}" has been acknowledged. Expected completion: ${request.landlordResponse?.estimatedCompletionDate ? new Date(request.landlordResponse.estimatedCompletionDate).toLocaleDateString() : 'TBD'}`,
    actionUrl: `/tenant/maintenance`,
    actionLabel: 'View Request',
    resourceType: 'MaintenanceRequest',
    resourceId: request._id,
    priority: 'normal',
  });
};

const notifyMaintenanceCompleted = async (request, tenant) => {
  return createAndSendNotification({
    recipientId: tenant._id,
    type: 'maintenance_completed',
    title: 'Maintenance Completed ✅',
    message: `Your maintenance request "${request.title}" has been completed. Please confirm and rate the service.`,
    actionUrl: `/tenant/maintenance`,
    actionLabel: 'Confirm & Rate',
    resourceType: 'MaintenanceRequest',
    resourceId: request._id,
    priority: 'normal',
  });
};

// ── CONTRACT NOTIFICATIONS ────────────────────────────────────────────────────

const notifyContractPendingSignature = async (contract, tenant, property) => {
  return createAndSendNotification({
    recipientId: tenant._id,
    type: 'contract_pending_signature',
    title: 'Lease Contract Ready to Sign 📋',
    message: `Your lease contract for "${property.title}" is ready. Please review and sign.`,
    actionUrl: `/tenant/contracts`,
    actionLabel: 'Review & Sign',
    resourceType: 'Contract',
    resourceId: contract._id,
    priority: 'high',
  });
};

const notifyContractActivated = async (contract, tenant, landlord, property) => {
  // Notify tenant
  await createAndSendNotification({
    recipientId: tenant._id,
    type: 'contract_activated',
    title: 'Lease Contract Active! 🎉',
    message: `Your lease for "${property.title}" is now active. Welcome to your new home!`,
    actionUrl: `/tenant/contracts`,
    actionLabel: 'View Contract',
    resourceType: 'Contract',
    resourceId: contract._id,
    priority: 'high',
  });

  // Notify landlord
  return createAndSendNotification({
    recipientId: landlord._id,
    type: 'contract_activated',
    title: 'Lease Contract Signed',
    message: `${tenant.firstName} ${tenant.lastName} has signed the lease for "${property.title}". Contract is now active.`,
    actionUrl: `/landlord/contracts`,
    actionLabel: 'View Contract',
    resourceType: 'Contract',
    resourceId: contract._id,
    priority: 'high',
  });
};

// ── KYC NOTIFICATIONS ─────────────────────────────────────────────────────────

const notifyKYCApproved = async (user) => {
  return createAndSendNotification({
    recipientId: user._id,
    type: 'kyc_approved',
    title: 'Identity Verified ✅',
    message: 'Your identity has been verified. You now have full access to all NestFind features.',
    actionUrl: user.role === 'landlord' ? '/landlord/properties/add' : '/listings',
    actionLabel: user.role === 'landlord' ? 'List a Property' : 'Browse Properties',
    priority: 'high',
    channels: { inApp: true, email: true },
    emailData: {
      type: 'kyc_status',
      email: user.email,
      firstName: user.firstName,
      status: 'approved',
    },
  });
};

const notifyKYCRejected = async (user, reason) => {
  return createAndSendNotification({
    recipientId: user._id,
    type: 'kyc_rejected',
    title: 'Verification Unsuccessful',
    message: `Your KYC verification was unsuccessful. ${reason ? `Reason: ${reason}` : 'Please resubmit with clear documents.'}`,
    actionUrl: '/profile/kyc',
    actionLabel: 'Resubmit Documents',
    priority: 'high',
    channels: { inApp: true, email: true },
    emailData: {
      type: 'kyc_status',
      email: user.email,
      firstName: user.firstName,
      status: 'rejected',
      reason,
    },
  });
};

// ── PROPERTY NOTIFICATIONS ────────────────────────────────────────────────────

const notifyPropertyApproved = async (property, landlord) => {
  return createAndSendNotification({
    recipientId: landlord._id,
    type: 'property_approved',
    title: 'Property Listing Approved ✅',
    message: `Your property "${property.title}" has been approved and is now live on NestFind.`,
    actionUrl: `/landlord/properties`,
    actionLabel: 'View Listing',
    resourceType: 'Property',
    resourceId: property._id,
    priority: 'high',
  });
};

const notifyPropertyRejected = async (property, landlord, reason) => {
  return createAndSendNotification({
    recipientId: landlord._id,
    type: 'property_rejected',
    title: 'Property Listing Rejected',
    message: `Your property "${property.title}" was not approved. ${reason ? `Reason: ${reason}` : 'Please review and resubmit.'}`,
    actionUrl: `/landlord/properties`,
    actionLabel: 'Edit Listing',
    resourceType: 'Property',
    resourceId: property._id,
    priority: 'high',
  });
};

// ── NEW MESSAGE NOTIFICATION ──────────────────────────────────────────────────

const notifyNewMessage = async (message, sender, recipient) => {
  const io = getIO();
  if (io) {
    io.to(`user:${recipient._id}`).emit('new_message', {
      conversationId: message.conversation,
      senderId: sender._id,
      senderName: `${sender.firstName} ${sender.lastName}`,
      preview: message.preview,
      createdAt: message.createdAt,
    });
  }

  return createAndSendNotification({
    recipientId: recipient._id,
    senderId: sender._id,
    type: 'new_message',
    title: `New message from ${sender.firstName}`,
    message: message.preview || 'You have a new message',
    actionUrl: `/messages`,
    actionLabel: 'Reply',
    resourceType: 'Conversation',
    resourceId: message.conversation,
    priority: 'normal',
  });
};

// ── AI NOTIFICATIONS ──────────────────────────────────────────────────────────

const notifyAIRecommendations = async (tenant, count) => {
  return createAndSendNotification({
    recipientId: tenant._id,
    type: 'ai_recommendation',
    title: `🤖 ${count} New AI Picks for You`,
    message: `Our AI found ${count} properties that match your preferences. Check them out!`,
    actionUrl: `/tenant/dashboard`,
    actionLabel: 'View Recommendations',
    priority: 'normal',
  });
};

// ── SYSTEM NOTIFICATIONS ──────────────────────────────────────────────────────

const sendSystemNotificationToAll = async (title, message, role = 'all') => {
  try {
    let query = {};
    if (role !== 'all') query.role = role;

    const User = require('../models/User');
    const users = await User.find(query).select('_id').lean();
    const recipientIds = users.map((u) => u._id);

    await Notification.createBulkNotifications(recipientIds, {
      type: 'admin_announcement',
      title,
      message,
      priority: 'normal',
      channels: { inApp: true },
    });

    // Emit to all connected users via socket
    const io = getIO();
    if (io) {
      io.emit('system_notification', { title, message });
    }

    return { success: true, sentTo: recipientIds.length };
  } catch (error) {
    logger.error(`System notification failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createAndSendNotification,
  notifyBookingReceived,
  notifyBookingApproved,
  notifyBookingDeclined,
  notifyPaymentReceived,
  notifyPaymentDue,
  notifyMaintenanceSubmitted,
  notifyMaintenanceAcknowledged,
  notifyMaintenanceCompleted,
  notifyContractPendingSignature,
  notifyContractActivated,
  notifyKYCApproved,
  notifyKYCRejected,
  notifyPropertyApproved,
  notifyPropertyRejected,
  notifyNewMessage,
  notifyAIRecommendations,
  sendSystemNotificationToAll,
};