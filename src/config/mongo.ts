import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";
import logger from "./logger";

export const connectMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI!);
    logger.info("✅ MongoDB connected");
  } catch (err) {
    logger.error("❌ MongoDB connection error", err);
    process.exit(1);
  }
};
