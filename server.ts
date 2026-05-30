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
    // Migration : ajout de la colonne fcm_token si absente
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT
    `);

    // Migration : suppression des doublons email (garde le compte admin/team_admin)
    await pool.query(`
      DELETE FROM users WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY email
                   ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'team_admin' THEN 1 ELSE 2 END
                 ) AS rn
          FROM users
        ) ranked
        WHERE rn > 1
      )
    `);

    // Migration : ajout de la contrainte UNIQUE sur email si absente
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'users_email_key' AND conrelid = 'users'::regclass
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        END IF;
      END $$
    `);

    logger.info("✅ Users table ready");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_vault_config (
        admin_id   UUID PRIMARY KEY,
        vault_key  TEXT NOT NULL,
        vault_salt TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("✅ Admin vault config table ready");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });
  } catch (err) {
    console.error("BOOTSTRAP ERROR:", err);
    logger.error("Server bootstrap failed: " + JSON.stringify(err, Object.getOwnPropertyNames(err as object)));
  }
};

void starServer();