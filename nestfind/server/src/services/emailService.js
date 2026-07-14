// nestfind/nestfind/server/src/services/emailService.js

const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

// ── TRANSPORTER ───────────────────────────────────────────────────────────────
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

// ── BASE EMAIL SENDER ─────────────────────────────────────────────────────────

/**
 * Send an email.
 *
 * @param {Object} options - Email options
 * @returns {Object} - { success, messageId }
 */
const sendEmail = async ({ to, subject, html, text = null }) => {
  try {
    const transport = getTransporter();
    const from = process.env.EMAIL_FROM || "NestFind <noreply@nestfind.et>";

    const info = await transport.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""),
    });

    logger.info(
      `Email sent: to=${to}, subject=${subject}, id=${info.messageId}`,
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email send failed: to=${to}, error=${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
    .header { background: #07080f; padding: 30px 40px; text-align: center; }
    .header h1 { color: #c9a84c; margin: 0; font-size: 28px; letter-spacing: 2px; }
    .header p { color: #888; margin: 5px 0 0; font-size: 12px; }
    .body { padding: 40px; color: #333; }
    .otp-box { background: #f8f4ea; border: 2px solid #c9a84c; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0; }
    .otp-code { font-size: 36px; font-weight: bold; color: #c9a84c; letter-spacing: 8px; }
    .btn { display: inline-block; background: #c9a84c; color: #07080f !important; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f8f8; padding: 20px 40px; text-align: center; font-size: 12px; color: #888; }
    .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    .warning { background: #fff8e1; border-left: 4px solid #c9a84c; padding: 12px 16px; margin: 15px 0; border-radius: 4px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 NESTFIND</h1>
      <p>Ethiopia's Premier AI-Powered Rental Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NestFind. All rights reserved.</p>
      <p>Addis Ababa, Ethiopia | support@nestfind.et</p>
      <p>If you did not request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>
`;

// ── SPECIFIC EMAIL SENDERS ────────────────────────────────────────────────────

/**
 * Send OTP verification email.
 */
const sendOTPEmail = async (
  email,
  firstName,
  otp,
  purpose,
  expiryMinutes = 10,
) => {
  const purposeLabels = {
    email_verification: "Email Verification",
    password_reset: "Password Reset",
    login_2fa: "Login Verification",
    phone_verification: "Phone Verification",
    account_deletion: "Account Deletion Confirmation",
    payment_confirmation: "Payment Confirmation",
    kyc_verification: "KYC Verification",
  };

  const label = purposeLabels[purpose] || "Verification";

  const html = baseTemplate(`
    <h2>Hello ${firstName},</h2>
    <p>Your NestFind ${label} code is:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <p style="color: #888; margin: 10px 0 0; font-size: 13px;">This code expires in <strong>${expiryMinutes} minutes</strong></p>
    </div>
    <div class="warning">
      🔒 <strong>Security Notice:</strong> Never share this code with anyone. NestFind staff will never ask for your OTP.
    </div>
    <p>If you did not request this code, please secure your account immediately by changing your password.</p>
  `);

  return sendEmail({
    to: email,
    subject: `${otp} is your NestFind ${label} code`,
    html,
  });
};

/**
 * Send welcome email after registration.
 */
const sendWelcomeEmail = async (email, firstName, role) => {
  const roleMessages = {
    tenant:
      "Start exploring thousands of verified rental properties across Addis Ababa and beyond.",
    landlord:
      "List your properties and connect with verified tenants using our AI-powered platform.",
    admin: "You now have access to the NestFind administration dashboard.",
  };

  const html = baseTemplate(`
    <h2>Welcome to NestFind, ${firstName}! 🎉</h2>
    <p>Your account has been created successfully.</p>
    <p>${roleMessages[role] || "Thank you for joining NestFind."}</p>
    <hr class="divider">
    <h3>What you can do with NestFind:</h3>
    <ul>
      ${
        role === "tenant"
          ? `
        <li>🔍 Search properties using AI natural language</li>
        <li>💬 Chat with our AI assistant for help</li>
        <li>📋 View and sign digital lease contracts</li>
        <li>💳 Pay rent securely online</li>
        <li>🔧 Submit maintenance requests instantly</li>
      `
          : role === "landlord"
            ? `
        <li>🏠 List unlimited verified properties</li>
        <li>🤖 AI-generated property descriptions</li>
        <li>💰 Get AI rent price recommendations</li>
        <li>📊 Track revenue and analytics</li>
        <li>✅ Verified tenant matching</li>
      `
            : "<li>Manage the platform</li>"
      }
    </ul>
    <a href="${process.env.CLIENT_URL}" class="btn">Get Started →</a>
    <div class="warning">
      ⚠️ Please verify your email address to activate all features.
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `Welcome to NestFind, ${firstName}! Your account is ready`,
    html,
  });
};

/**
 * Send password reset email.
 */
const sendPasswordResetEmail = async (email, firstName, resetUrl) => {
  const html = baseTemplate(`
    <h2>Password Reset Request</h2>
    <p>Hello ${firstName},</p>
    <p>We received a request to reset your NestFind password. Click the button below to create a new password:</p>
    <a href="${resetUrl}" class="btn">Reset My Password →</a>
    <p style="font-size: 13px; color: #888;">This link expires in <strong>1 hour</strong>.</p>
    <div class="warning">
      🔒 If you did not request a password reset, please ignore this email. Your password will not change.
    </div>
    <hr class="divider">
    <p style="font-size: 12px; color: #888;">If the button doesn't work, copy and paste this link:<br>${resetUrl}</p>
  `);

  return sendEmail({
    to: email,
    subject: "Reset your NestFind password",
    html,
  });
};

/**
 * Send booking confirmation to tenant.
 */
const sendBookingConfirmationEmail = async (
  email,
  firstName,
  bookingDetails,
) => {
  const html = baseTemplate(`
    <h2>Booking Request Submitted ✅</h2>
    <p>Hello ${firstName},</p>
    <p>Your property visit request has been submitted successfully.</p>
    <hr class="divider">
    <h3>Booking Details:</h3>
    <table style="width:100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #888;">Property:</td><td><strong>${bookingDetails.propertyTitle}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Location:</td><td>${bookingDetails.location}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Requested Date:</td><td>${bookingDetails.preferredDate}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Requested Time:</td><td>${bookingDetails.preferredTime}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Landlord:</td><td>${bookingDetails.landlordName}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Status:</td><td><span style="color: #f59e0b;">⏳ Pending Approval</span></td></tr>
    </table>
    <hr class="divider">
    <p>The landlord will respond within 24 hours. You will receive an email notification once they approve or decline your request.</p>
    <a href="${process.env.CLIENT_URL}/tenant/bookings" class="btn">View My Bookings →</a>
  `);

  return sendEmail({
    to: email,
    subject: `Booking request submitted — ${bookingDetails.propertyTitle}`,
    html,
  });
};

/**
 * Send booking approval email to tenant.
 */
const sendBookingApprovalEmail = async (email, firstName, bookingDetails) => {
  const html = baseTemplate(`
    <h2>Your Visit is Confirmed! 🎉</h2>
    <p>Hello ${firstName},</p>
    <p>Great news! Your property visit request has been <strong style="color: #10b981;">approved</strong>.</p>
    <hr class="divider">
    <h3>Confirmed Visit Details:</h3>
    <table style="width:100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #888;">Property:</td><td><strong>${bookingDetails.propertyTitle}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Location:</td><td>${bookingDetails.location}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Date:</td><td><strong>${bookingDetails.confirmedDate}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Time:</td><td><strong>${bookingDetails.confirmedTime}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Landlord:</td><td>${bookingDetails.landlordName}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Phone:</td><td>${bookingDetails.landlordPhone || "Contact via platform"}</td></tr>
    </table>
    ${bookingDetails.landlordResponse ? `<div class="warning">💬 Message from landlord: "${bookingDetails.landlordResponse}"</div>` : ""}
    <a href="${process.env.CLIENT_URL}/tenant/bookings" class="btn">View Booking →</a>
    <p style="font-size: 13px; color: #888;">Please arrive on time. If you need to cancel, do so at least 24 hours in advance.</p>
  `);

  return sendEmail({
    to: email,
    subject: `Visit confirmed — ${bookingDetails.propertyTitle}`,
    html,
  });
};

/**
 * Send payment receipt email.
 */
const sendPaymentReceiptEmail = async (email, firstName, paymentDetails) => {
  const html = baseTemplate(`
    <h2>Payment Receipt 🧾</h2>
    <p>Hello ${firstName},</p>
    <p>Your payment has been processed successfully.</p>
    <hr class="divider">
    <div class="otp-box">
      <p style="color: #888; margin: 0 0 5px; font-size: 13px;">Receipt Number</p>
      <div style="font-size: 20px; font-weight: bold; color: #c9a84c;">${paymentDetails.receiptNumber}</div>
    </div>
    <h3>Payment Details:</h3>
    <table style="width:100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #888;">Amount Paid:</td><td><strong>ETB ${paymentDetails.amount?.toLocaleString()}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Payment Type:</td><td>${paymentDetails.paymentType}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Payment Method:</td><td>${paymentDetails.paymentMethod}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Property:</td><td>${paymentDetails.propertyTitle}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Period:</td><td>${paymentDetails.periodLabel || "N/A"}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Date:</td><td>${new Date().toLocaleDateString()}</td></tr>
      <tr><td style="padding: 8px 0; color: #888;">Transaction ID:</td><td style="font-size: 12px; color: #888;">${paymentDetails.transactionId}</td></tr>
    </table>
    <a href="${process.env.CLIENT_URL}/tenant/payments" class="btn">View Payment History →</a>
  `);

  return sendEmail({
    to: email,
    subject: `Payment receipt — ETB ${paymentDetails.amount?.toLocaleString()} — ${paymentDetails.receiptNumber}`,
    html,
  });
};

/**
 * Send KYC status update email.
 */
const sendKYCStatusEmail = async (email, firstName, status, reason = null) => {
  const statusMessages = {
    approved: {
      title: "Identity Verified ✅",
      body: "Your identity has been verified successfully. You now have full access to all NestFind features.",
      color: "#10b981",
    },
    rejected: {
      title: "Verification Unsuccessful",
      body: `Your identity verification was not successful. ${reason ? `Reason: ${reason}` : ""} Please resubmit with clear, valid documents.`,
      color: "#ef4444",
    },
    resubmission_required: {
      title: "Documents Resubmission Required",
      body: `Additional information is needed for your verification. ${reason ? `Reason: ${reason}` : ""} Please resubmit your documents.`,
      color: "#f59e0b",
    },
  };

  const msg = statusMessages[status];
  if (!msg) return { success: false, error: "Invalid KYC status" };

  const html = baseTemplate(`
    <h2>${msg.title}</h2>
    <p>Hello ${firstName},</p>
    <p style="color: ${msg.color}; font-weight: bold;">${msg.body}</p>
    ${
      status === "rejected" || status === "resubmission_required"
        ? `
      <a href="${process.env.CLIENT_URL}/profile/kyc" class="btn">Resubmit Documents →</a>
    `
        : `
      <a href="${process.env.CLIENT_URL}" class="btn">Explore NestFind →</a>
    `
    }
  `);

  return sendEmail({
    to: email,
    subject: `NestFind KYC Update — ${msg.title}`,
    html,
  });
};

/**
 * Send lease expiry reminder.
 */
const sendLeaseExpiryReminderEmail = async (
  email,
  firstName,
  rentalDetails,
) => {
  const html = baseTemplate(`
    <h2>Your Lease is Expiring Soon ⏰</h2>
    <p>Hello ${firstName},</p>
    <p>Your lease for <strong>${rentalDetails.propertyTitle}</strong> is expiring in <strong>${rentalDetails.daysRemaining} days</strong> on <strong>${rentalDetails.endDate}</strong>.</p>
    <hr class="divider">
    <h3>What you can do:</h3>
    <ul>
      <li>🔄 <a href="${process.env.CLIENT_URL}/tenant/rentals">Renew your lease</a> — contact your landlord to discuss renewal</li>
      <li>🔍 <a href="${process.env.CLIENT_URL}/listings">Browse new properties</a> — start your search early</li>
      <li>📋 Review your notice period requirements in your contract</li>
    </ul>
    <div class="warning">
      ⚠️ Your lease requires <strong>${rentalDetails.noticePeriodDays} days notice</strong> before moving out. Please plan accordingly.
    </div>
    <a href="${process.env.CLIENT_URL}/tenant/rentals" class="btn">View My Rental →</a>
  `);

  return sendEmail({
    to: email,
    subject: `Your NestFind lease expires in ${rentalDetails.daysRemaining} days`,
    html,
  });
};

/**
 * Send rent due reminder.
 */
const sendRentDueReminderEmail = async (email, firstName, rentalDetails) => {
  const html = baseTemplate(`
    <h2>Rent Payment Reminder 💳</h2>
    <p>Hello ${firstName},</p>
    <p>Your rent payment of <strong>ETB ${rentalDetails.monthlyRent?.toLocaleString()}</strong> for <strong>${rentalDetails.propertyTitle}</strong> is due on <strong>${rentalDetails.dueDate}</strong>.</p>
    <hr class="divider">
    <div class="warning">
      💡 Pay on time to maintain your good tenant rating and avoid late fees.
    </div>
    <a href="${process.env.CLIENT_URL}/tenant/payments/make" class="btn">Pay Now →</a>
  `);

  return sendEmail({
    to: email,
    subject: `Rent due: ETB ${rentalDetails.monthlyRent?.toLocaleString()} — ${rentalDetails.dueDate}`,
    html,
  });
};

/**
 * Send admin broadcast email to multiple users.
 */
const sendBroadcastEmail = async (recipients, subject, message) => {
  const results = { sent: 0, failed: 0 };

  for (const recipient of recipients) {
    const html = baseTemplate(`
      <h2>Message from NestFind Team</h2>
      <p>Hello ${recipient.firstName},</p>
      <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${message}
      </div>
      <a href="${process.env.CLIENT_URL}" class="btn">Visit NestFind →</a>
    `);

    const result = await sendEmail({ to: recipient.email, subject, html });
    if (result.success) results.sent++;
    else results.failed++;
  }

  return results;
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingApprovalEmail,
  sendPaymentReceiptEmail,
  sendKYCStatusEmail,
  sendLeaseExpiryReminderEmail,
  sendRentDueReminderEmail,
  sendBroadcastEmail,
};
