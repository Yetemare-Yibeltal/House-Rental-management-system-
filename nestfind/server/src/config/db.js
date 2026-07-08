const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);

      logger.info(`MongoDB connected: ${conn.connection.host}`);
      logger.info(`Database: ${conn.connection.name}`);

      mongoose.connection.on("error", (err) => {
        logger.error(`MongoDB error: ${err.message}`);
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB disconnected. Reconnecting...");
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("MongoDB reconnected");
      });

      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed");
        process.exit(0);
      });

      break;
    } catch (error) {
      retries += 1;
      logger.error(
        `MongoDB connection failed (${retries}/${maxRetries}): ${error.message}`,
      );

      if (retries === maxRetries) {
        logger.error("Max retries reached. Exiting...");
        process.exit(1);
      }

      logger.info("Retrying in 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
