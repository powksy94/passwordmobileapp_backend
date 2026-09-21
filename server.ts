import app from "./app.js";
import { connectMongo } from "./src/shared/config/mongo";
import { pool } from "./src/shared/config/postgres";
import { NODE_ENV, PORT } from "./src/shared/config/env";
import logger from "./src/shared/config/logger";
import { AdminVaultModel } from "./src/domains/adminVault/model/admin-vault.model";

const starServer = async () => {
  try {
    await connectMongo();
    logger.info("✅ MongoDB connected");

    console.log("DATABASE_URL defined:", !!process.env.DATABASE_URL, "length:", process.env.DATABASE_URL?.length ?? 0);
    await pool.query("SELECT 1");
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
    // Migration: adding the fcm_token column if missing
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT
    `);

    // Migration: removing duplicate emails (keeps the admin/team_admin account)
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

    // Migration: adding the UNIQUE constraint on email if missing
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit (
        id         SERIAL PRIMARY KEY,
        user_id    UUID NOT NULL,
        action     TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("✅ Audit table ready");

    // Migration: automatic promotion of ADMIN_EMAIL to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const result = await pool.query(
        `UPDATE users SET role = 'admin' WHERE email = $1 AND role != 'admin'`,
        [adminEmail]
      );
      if (result.rowCount && result.rowCount > 0) {
        logger.info(`✅ Account ${adminEmail} promoted to admin`);
      }

      // Migration: if the admin was just recreated with a new UUID,
      // reattaches the old orphan vault config to preserve the data.
      const adminUser = await pool.query(
        `SELECT id FROM users WHERE email = $1`, [adminEmail]
      );
      if (adminUser.rows.length > 0) {
        const newId = adminUser.rows[0].id;
        // Looks for orphan vault configs (without a matching user)
        const orphans = await pool.query(
          `SELECT admin_id FROM admin_vault_config
           WHERE admin_id NOT IN (SELECT id FROM users)`
        );
        if (orphans.rows.length > 1) {
          // Several orphans: impossible to know which one belongs to
          // the current admin without risking attaching/overwriting the wrong key.
          // We touch nothing and ask for manual intervention.
          logger.warn(
            `⚠️ Several orphan vault configs detected (${orphans.rows.length}) - ` +
            `automatic reattachment disabled, manual intervention required`,
            { orphanIds: orphans.rows.map((r) => r.admin_id) }
          );
        } else if (orphans.rows.length === 1) {
          const oldId = orphans.rows[0].admin_id;
          const hasConfig = await pool.query(
            `SELECT 1 FROM admin_vault_config WHERE admin_id = $1`, [newId]
          );
          if (hasConfig.rows.length === 0) {
            // New account without a config: reattaches the orphan
            await pool.query(
              `UPDATE admin_vault_config SET admin_id = $1 WHERE admin_id = $2`,
              [newId, oldId]
            );
            await AdminVaultModel.updateMany({ adminId: oldId }, { adminId: newId });
            logger.info(`✅ Vault config + MongoDB items reattached (${oldId} -> ${newId})`);
          } else {
            // New account already has its own config: never delete the
            // orphan key (the associated MongoDB items would become
            // permanently undecryptable). We log it for a
            // manual decision (merge/export/deliberate deletion).
            logger.warn(
              `⚠️ Orphan vault config (${oldId}) coexists with the current config (${newId}) - ` +
              `kept as is, no automatic deletion`
            );
          }
        }
      }
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });
  } catch (err) {
    console.error("BOOTSTRAP ERROR:", err);
    logger.error("Server bootstrap failed: " + JSON.stringify(err, Object.getOwnPropertyNames(err as object)));
    // Never leave the process running without having started the server:
    // the orchestrator (Docker/K8s) must see the container as dead and restart it.
    process.exit(1);
  }
};

void starServer();