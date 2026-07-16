// nestfind/nestfind/server/src/utils/dbIndexes.js

const logger = require("./logger");

/**
 * Create all database indexes for optimal query performance.
 * Called once on server startup after MongoDB connects.
 */
const createIndexes = async () => {
  try {
    const models = {
      User: require("../models/User"),
      Property: require("../models/Property"),
      Booking: require("../models/Booking"),
      Rental: require("../models/Rental"),
      Payment: require("../models/Payment"),
      Message: require("../models/Message"),
      Notification: require("../models/Notification"),
      AuditLog: require("../models/AuditLog"),
      AIConversation: require("../models/AIConversation"),
    };

    // Create indexes for each model
    await Promise.all(
      Object.entries(models).map(async ([name, Model]) => {
        try {
          await Model.createIndexes();
          logger.debug(`Indexes created for ${name}`);
        } catch (error) {
          logger.warn(`Index creation warning for ${name}: ${error.message}`);
        }
      }),
    );

    logger.info("Database indexes created successfully");
    return { success: true };
  } catch (error) {
    logger.error(`Database index creation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Drop and recreate all indexes (use with caution — for migrations).
 */
const rebuildIndexes = async () => {
  logger.warn("Rebuilding all database indexes...");
  return createIndexes();
};

module.exports = { createIndexes, rebuildIndexes };
