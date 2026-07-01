const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create reusable transporter
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
};

// Verify transporter connection on startup
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email (SMTP) connected successfully');
  } catch (error) {
    logger.error(`Email configuration error: ${error.message}`);
    logger.warn('Email sending will not work without valid SMTP credentials');
  }
};

// Base HTML wrapper matching NestFind brand
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NestFind</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #07080f;
      color: #eeeaf2;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 15px;
      line-height: 1.7;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background-color: #0d0f1a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #13162a, #07080f);
      padding: 32px 40px;
      border-bottom: 1px solid rgba(201,168,76,0.2);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-mark {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #e2c06a, #7a6230);
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .logo-text {
      font-size: 22px;
      font-weight: 700;
      color: #eeeaf2;
      letter-spacing: -0.5px;
    }
    .logo-text span { color: #c9a84c; }
    .content {
      padding: 40px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #eeeaf2;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .text {
      color: #8b8699;
      margin-bottom: 16px;
    }
    .highlight {
      color: #e2c06a;
      font-weight: 600;
    }
    .otp-box {
      background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05));
      border: 1px solid rgba(201,168,76,0.3);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 12px;
      color: #e2c06a;
      font-family: 'Courier New', monospace;
    }
    .otp-expire {
      font-size: 13px;
      color: #4a4560;
      margin-top: 8px;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #e2c06a, #c9a84c);
      color: #07080f;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 15px;
      margin: 24px 0;
    }
    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.07);
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 14px;
    }
    .info-label { color: #4a4560; }
    .info-value { color: #eeeaf2; font-weight: 600; }
    .warning-box {
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 13px;
      color: #f87171;
      margin: 16px 0;
    }
    .success-box {
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(34,197,94,0.2);
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 13px;
      color: #4ade80;
      margin: 16px 0;
    }
    .footer {
      background: #07080f;
      padding: 24px 40px;
      border-top: 1px solid rgba(255,255,255,0.05);
      text-align: center;
      font-size: 12px;
      color: #4a4560;
    }
    .footer a { color: #7a6230; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-mark">🏠</div>
      <div class="logo-text">Nest<span>Find</span></div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NestFind · Ethiopia's Premier Rental Platform</p>
      <p style="margin-top:6px;">
        <a href="${process.env.CLIENT_URL}/privacy">Privacy Policy</a> ·
        <a href="${process.env.CLIENT_URL}/contact">Contact Support</a> ·
        <a href="${process.env.CLIENT_URL}/unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin-top:6px;">Addis Ababa, Ethiopia</p>
    </div>
  </div>
</body>
</html>
`;

// ── EMAIL TEMPLATES ────────────────────────────────────────────────────────

const templates = {
  // 1. Welcome email after registration
  welcome: (data) => ({
    subject: `Welcome to NestFind, ${data.firstName}! 🏠`,
    html: baseTemplate(`
      <h1 class="title">Welcome to NestFind, ${data.firstName}!</h1>
      <p class="text">
        Your account has been created successfully. You're now part of Ethiopia's
        most trusted rental management platform.
      </p>
      <div class="info-row">
        <span class="info-label">Account Email</span>
        <span class="info-value">${data.email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Role</span>
        <span class="info-value highlight">${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Member Since</span>
        <span class="info-value">${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <hr class="divider"/>
      <p class="text">To get started, please verify your email address by clicking the button below:</p>
      <a href="${process.env.CLIENT_URL}/verify-otp?email=${data.email}" class="btn">
        Verify My Account →
      </a>
      <p class="text" style="font-size:13px;margin-top:16px;">
        If you did not create this account, please ignore this email or contact our
        support team immediately at support@nestfind.et
      </p>
    `),
  }),

  // 2. OTP verification code
  otp: (data) => ({
    subject: `${data.otp} — Your NestFind verification code`,
    html: baseTemplate(`
      <h1 class="title">Verify Your ${data.purpose === 'register' ? 'Account' : 'Identity'}</h1>
      <p class="text">
        ${
          data.purpose === 'register'
            ? 'Please use the code below to verify your NestFind account.'
            : data.purpose === 'reset'
              ? 'Use this code to reset your password. Do not share it with anyone.'
              : 'Use this code to complete your login.'
        }
      </p>
      <div class="otp-box">
        <div class="otp-code">${data.otp}</div>
        <div class="otp-expire">This code expires in <strong style="color:#e2c06a;">${data.expiresIn || '10'} minutes</strong></div>
      </div>
      <div class="warning-box">
        ⚠ Never share this code with anyone. NestFind staff will never ask for your OTP.
      </div>
      <p class="text" style="font-size:13px;">
        If you didn't request this code, you can safely ignore this email.
        Your account remains secure.
      </p>
    `),
  }),

  // 3. Password reset link
  resetPassword: (data) => ({
    subject: 'Reset your NestFind password',
    html: baseTemplate(`
      <h1 class="title">Reset Your Password</h1>
      <p class="text">
        We received a request to reset the password for your NestFind account
        associated with <span class="highlight">${data.email}</span>.
      </p>
      <p class="text">Click the button below to create a new password. This link expires in <span class="highlight">1 hour</span>.</p>
      <a href="${process.env.CLIENT_URL}/reset-password?token=${data.token}" class="btn">
        Reset My Password →
      </a>
      <hr class="divider"/>
      <div class="warning-box">
        ⚠ If you did not request a password reset, please ignore this email.
        Your password will not be changed.
      </div>
      <p class="text" style="font-size:13px;">
        For security, this link can only be used once and expires in 1 hour.
        If you need help, contact support@nestfind.et
      </p>
    `),
  }),

  // 4. Payment receipt
  paymentReceipt: (data) => ({
    subject: `Payment Receipt — ETB ${data.amount.toLocaleString()} — NestFind`,
    html: baseTemplate(`
      <div class="success-box">✓ Payment Received Successfully</div>
      <h1 class="title">Payment Receipt</h1>
      <p class="text">Your rent payment has been processed successfully. Here are your payment details:</p>
      <div class="info-row">
        <span class="info-label">Transaction ID</span>
        <span class="info-value">${data.transactionId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Property</span>
        <span class="info-value">${data.propertyTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Landlord</span>
        <span class="info-value">${data.landlordName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Date</span>
        <span class="info-value">${new Date(data.date).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Method</span>
        <span class="info-value">${data.method}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Period</span>
        <span class="info-value">${data.period}</span>
      </div>
      <div class="info-row" style="margin-top:8px;padding-top:16px;border-top:1px solid rgba(201,168,76,0.2);">
        <span class="info-label" style="font-size:16px;font-weight:700;color:#eeeaf2;">Amount Paid</span>
        <span class="info-value highlight" style="font-size:20px;">ETB ${data.amount.toLocaleString()}</span>
      </div>
      <hr class="divider"/>
      <p class="text" style="font-size:13px;">
        Keep this receipt for your records. You can also view all your payment history
        in your NestFind dashboard.
      </p>
      <a href="${process.env.CLIENT_URL}/tenant/payments" class="btn">View Payment History →</a>
    `),
  }),

  // 5. Lease / Contract signed
  contractSigned: (data) => ({
    subject: `Lease Agreement Signed — ${data.propertyTitle}`,
    html: baseTemplate(`
      <div class="success-box">✓ Lease Agreement Signed by Both Parties</div>
      <h1 class="title">Your Lease is Now Active</h1>
      <p class="text">
        The digital lease agreement for <span class="highlight">${data.propertyTitle}</span>
        has been signed by both parties and is now legally active.
      </p>
      <div class="info-row">
        <span class="info-label">Contract ID</span>
        <span class="info-value">${data.contractId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Property</span>
        <span class="info-value">${data.propertyTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tenant</span>
        <span class="info-value">${data.tenantName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Landlord</span>
        <span class="info-value">${data.landlordName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Lease Start</span>
        <span class="info-value">${new Date(data.startDate).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Lease End</span>
        <span class="info-value">${new Date(data.endDate).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Monthly Rent</span>
        <span class="info-value highlight">ETB ${data.monthlyRent.toLocaleString()}</span>
      </div>
      <hr class="divider"/>
      <a href="${process.env.CLIENT_URL}/tenant/contracts" class="btn">View My Contract →</a>
      <p class="text" style="font-size:13px;margin-top:16px;">
        Your first rent payment of ETB ${data.monthlyRent.toLocaleString()} is due on
        <span class="highlight">${new Date(data.firstPaymentDue).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</span>.
      </p>
    `),
  }),

  // 6. Booking approved
  bookingApproved: (data) => ({
    subject: `Visit Approved — ${data.propertyTitle}`,
    html: baseTemplate(`
      <div class="success-box">✓ Your Visit Request Has Been Approved</div>
      <h1 class="title">Visit Confirmed!</h1>
      <p class="text">
        Great news! Your visit request for <span class="highlight">${data.propertyTitle}</span>
        has been approved by the landlord.
      </p>
      <div class="info-row">
        <span class="info-label">Property</span>
        <span class="info-value">${data.propertyTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Visit Date</span>
        <span class="info-value highlight">${new Date(data.visitDate).toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Visit Time</span>
        <span class="info-value">${data.visitTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Landlord</span>
        <span class="info-value">${data.landlordName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Landlord Phone</span>
        <span class="info-value">${data.landlordPhone}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Property Address</span>
        <span class="info-value">${data.propertyAddress}</span>
      </div>
      <hr class="divider"/>
      <a href="${process.env.CLIENT_URL}/tenant/bookings" class="btn">View My Bookings →</a>
    `),
  }),

  // 7. Booking declined
  bookingDeclined: (data) => ({
    subject: `Visit Request Update — ${data.propertyTitle}`,
    html: baseTemplate(`
      <h1 class="title">Visit Request Update</h1>
      <p class="text">
        Unfortunately, your visit request for <span class="highlight">${data.propertyTitle}</span>
        was not approved at this time.
      </p>
      ${
        data.reason
          ? `
        <div class="info-row">
          <span class="info-label">Reason</span>
          <span class="info-value">${data.reason}</span>
        </div>
      `
          : ''
      }
      <hr class="divider"/>
      <p class="text">
        Don't worry — there are many more great properties available on NestFind.
      </p>
      <a href="${process.env.CLIENT_URL}/properties" class="btn">Browse Properties →</a>
    `),
  }),

  // 8. Maintenance request update
  maintenanceUpdate: (data) => ({
    subject: `Maintenance Update — ${data.issueTitle}`,
    html: baseTemplate(`
      <h1 class="title">Maintenance Request Update</h1>
      <p class="text">
        There is an update on your maintenance request:
        <span class="highlight">${data.issueTitle}</span>
      </p>
      <div class="info-row">
        <span class="info-label">Request ID</span>
        <span class="info-value">${data.requestId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Property</span>
        <span class="info-value">${data.propertyTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value highlight">${data.status}</span>
      </div>
      ${
        data.response
          ? `
        <div class="info-row">
          <span class="info-label">Landlord Response</span>
          <span class="info-value">${data.response}</span>
        </div>
      `
          : ''
      }
      ${
        data.scheduledDate
          ? `
        <div class="info-row">
          <span class="info-label">Scheduled For</span>
          <span class="info-value">${new Date(data.scheduledDate).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      `
          : ''
      }
      <hr class="divider"/>
      <a href="${process.env.CLIENT_URL}/tenant/maintenance" class="btn">View Request →</a>
    `),
  }),

  // 9. Rent payment reminder
  paymentReminder: (data) => ({
    subject: `Rent Due in ${data.daysUntilDue} Days — ETB ${data.amount.toLocaleString()}`,
    html: baseTemplate(`
      <h1 class="title">Rent Payment Reminder</h1>
      <p class="text">
        This is a friendly reminder that your rent payment is due in
        <span class="highlight">${data.daysUntilDue} day${data.daysUntilDue !== 1 ? 's' : ''}</span>.
      </p>
      <div class="info-row">
        <span class="info-label">Property</span>
        <span class="info-value">${data.propertyTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Due Date</span>
        <span class="info-value highlight">${new Date(data.dueDate).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Amount Due</span>
        <span class="info-value highlight" style="font-size:18px;">ETB ${data.amount.toLocaleString()}</span>
      </div>
      <hr class="divider"/>
      <a href="${process.env.CLIENT_URL}/tenant/payments" class="btn">Pay Now →</a>
      <p class="text" style="font-size:13px;margin-top:16px;">
        Late payments may incur a fee as specified in your lease agreement.
        Pay on time to keep your rental record clean.
      </p>
    `),
  }),

  // 10. Platform broadcast (admin sends to all users)
  broadcast: (data) => ({
    subject: `NestFind: ${data.subject}`,
    html: baseTemplate(`
      <h1 class="title">${data.subject}</h1>
      <p class="text">${data.message}</p>
      ${
        data.ctaText && data.ctaLink
          ? `
        <a href="${data.ctaLink}" class="btn">${data.ctaText} →</a>
      `
          : ''
      }
      <hr class="divider"/>
      <p class="text" style="font-size:13px;">
        This message was sent to all NestFind users by the platform administration team.
      </p>
    `),
  }),

  // 11. KYC approved
  kycApproved: (data) => ({
    subject: 'Your NestFind account is now verified ✓',
    html: baseTemplate(`
      <div class="success-box">✓ KYC Verification Approved</div>
      <h1 class="title">You're Verified, ${data.firstName}!</h1>
      <p class="text">
        Your identity has been successfully verified. Your NestFind account now
        has full access to all platform features.
      </p>
      <div class="info-row">
        <span class="info-label">Verified On</span>
        <span class="info-value">${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Role</span>
        <span class="info-value highlight">${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</span>
      </div>
      <hr class="divider"/>
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Go to Dashboard →</a>
    `),
  }),

  // 12. KYC rejected
  kycRejected: (data) => ({
    subject: 'Action Required — NestFind KYC Verification',
    html: baseTemplate(`
      <h1 class="title">Verification Needs Attention</h1>
      <p class="text">
        Unfortunately, we were unable to verify your identity with the documents provided.
        Please review the reason below and resubmit.
      </p>
      <div class="warning-box">
        ⚠ Rejection Reason: ${data.reason || 'Documents were unclear or incomplete.'}
      </div>
      <p class="text">Please resubmit clearer, valid government-issued documents to complete your verification.</p>
      <hr class="divider"/>
      <a href="${process.env.CLIENT_URL}/profile/kyc" class="btn">Resubmit Documents →</a>
      <p class="text" style="font-size:13px;margin-top:16px;">
        Need help? Contact our support team at support@nestfind.et
      </p>
    `),
  }),
};

// ── SEND EMAIL FUNCTION ─────────────────────────────────────────────────────

const sendEmail = async (to, templateName, data) => {
  try {
    const template = templates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = template(data);
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `NestFind <noreply@nestfind.et>`,
      to,
      subject,
      html,
    });

    logger.info(`Email sent: ${templateName} → ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email send failed: ${templateName} → ${to}: ${error.message}`);
    // Don't throw — email failure should not crash the main request
    return { success: false, error: error.message };
  }
};

// Send to multiple recipients at once
const sendBulkEmail = async (recipients, templateName, data) => {
  const results = await Promise.allSettled(
    recipients.map((to) => sendEmail(to, templateName, data))
  );

  const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  logger.info(`Bulk email: ${successful} sent, ${failed} failed (template: ${templateName})`);
  return { successful, failed, total: results.length };
};

module.exports = {
  verifyEmailConfig,
  sendEmail,
  sendBulkEmail,
  templates,
};
