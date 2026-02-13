import app from "./app.js";
import { connectMongo } from "./src/config/mongo";
import { pool } from "./src/config/postgres";
import { NODE_ENV, PORT } from "./src/config/env";
import logger from "./src/config/logger";

const starServer = async () => {
  try {
    await connectMongo();
    logger.info("✅ MongoDB connected");

    console.log("DATABASE_URL defined:", !!process.env.DATABASE_URL, "length:", process.env.DATABASE_URL?.length ?? 0);
    await pool.connect();
    logger.info("✅ PostgreSQL connected");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        salt TEXT
      )
    `);
    logger.info("✅ Users table ready");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });
  } catch (err) {
    console.error("BOOTSTRAP ERROR:", err);
    logger.error("Server bootstrap failed: " + JSON.stringify(err, Object.getOwnPropertyNames(err as object)));
  }
};

void starServer();