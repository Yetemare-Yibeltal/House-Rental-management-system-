// nestfind/nestfind/server/src/utils/seedData.js

const logger = require("./logger");

/**
 * Seed the database with initial data for development and testing.
 * Creates admin user, sample properties, FAQs, and system settings.
 */
const seedDatabase = async () => {
  try {
    logger.info("Starting database seed...");

    await seedSystemSettings();
    await seedAdminUser();
    await seedFAQs();

    logger.info("Database seed completed successfully");
    return { success: true };
  } catch (error) {
    logger.error(`Database seed failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Seed system settings with defaults.
 */
const seedSystemSettings = async () => {
  try {
    const SystemSettings = require("../models/SystemSettings");
    const existing = await SystemSettings.findOne({ key: "system_settings" });
    if (!existing) {
      await SystemSettings.create({ key: "system_settings" });
      logger.info("System settings seeded");
    }
  } catch (error) {
    logger.warn(`System settings seed skipped: ${error.message}`);
  }
};

/**
 * Seed initial admin user.
 */
const seedAdminUser = async () => {
  try {
    const User = require("../models/User");
    const existing = await User.findOne({ email: "admin@nestfind.et" });

    if (!existing) {
      await User.create({
        firstName: "NestFind",
        lastName: "Admin",
        email: "admin@nestfind.et",
        password: "Admin@NestFind2024!",
        role: "admin",
        status: "active",
        isEmailVerified: true,
        isKYCVerified: true,
        adminPermissions: {
          canManageUsers: true,
          canManageProperties: true,
          canManagePayments: true,
          canManageContent: true,
          canViewReports: true,
          canManageSettings: true,
          isSuperAdmin: true,
        },
      });
      logger.info("Admin user seeded: admin@nestfind.et");
    }
  } catch (error) {
    logger.warn(`Admin user seed skipped: ${error.message}`);
  }
};

/**
 * Seed initial FAQ entries.
 */
const seedFAQs = async () => {
  try {
    const FAQ = require("../models/FAQ");
    const count = await FAQ.countDocuments();
    if (count > 0) return;

    const faqs = [
      {
        question: "How does NestFind work?",
        answer:
          "NestFind connects tenants looking for rental properties with verified landlords in Ethiopia. Browse listings, schedule visits, sign digital contracts, and pay rent — all in one platform.",
        category: "general",
        targetRole: "all",
        displayOrder: 1,
        isFeatured: true,
        isPublished: true,
      },
      {
        question: "How do I list my property on NestFind?",
        answer:
          'Register as a landlord, complete KYC verification, then click "Add Property" in your dashboard. Fill in property details, upload photos, set your price, and submit for admin review. Approved listings go live within 24 hours.',
        category: "landlord",
        targetRole: "landlord",
        displayOrder: 1,
        isFeatured: true,
        isPublished: true,
      },
      {
        question: "Is NestFind safe and secure?",
        answer:
          "Yes. All landlords are KYC-verified with government ID. Properties are reviewed before listing. Payments are processed securely. Our AI fraud detection system monitors all listings for suspicious activity.",
        category: "general",
        targetRole: "all",
        displayOrder: 2,
        isFeatured: true,
        isPublished: true,
      },
      {
        question: "How does the AI assistant help me?",
        answer:
          'Our AI assistant can help you search for properties using natural language ("3 bedroom apartment near Bole under 30k"), explain lease contracts in simple terms, diagnose maintenance issues, and provide personalized property recommendations based on your preferences.',
        category: "ai_features",
        targetRole: "all",
        displayOrder: 1,
        isFeatured: true,
        isPublished: true,
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "NestFind accepts CBE Transfer, Telebirr, Visa Debit, and bank transfers. All payments are processed securely and receipts are generated automatically.",
        category: "payments",
        targetRole: "all",
        displayOrder: 1,
        isFeatured: true,
        isPublished: true,
      },
      {
        question: "What is KYC verification and why do I need it?",
        answer:
          "KYC (Know Your Customer) is an identity verification process required by NestFind to ensure platform safety. Landlords must complete KYC before listing properties. Upload your national ID, a selfie, and proof of ownership.",
        category: "kyc",
        targetRole: "all",
        displayOrder: 1,
        isPublished: true,
      },
    ];

    await FAQ.insertMany(faqs);
    logger.info(`${faqs.length} FAQs seeded`);
  } catch (error) {
    logger.warn(`FAQ seed skipped: ${error.message}`);
  }
};

module.exports = {
  seedDatabase,
  seedSystemSettings,
  seedAdminUser,
  seedFAQs,
};
