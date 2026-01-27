import app from "./app.js";
import { connectMongo } from "./src/config/mongo";
import { pool } from "./src/config/postgres";
import { NODE_ENV, PORT } from "./src/config/env";
import logger from "./src/config/logger";

const starServer = async () => {
  try {
    await connectMongo();
    logger.info("✅ MongoDB connected");

    await pool.connect();
    logger.info("✅ PostgreSQL connected");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error("Server bootstrap failed", err);
  }
};

void starServer();