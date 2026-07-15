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

    // Migration : promotion automatique de l'ADMIN_EMAIL en admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const result = await pool.query(
        `UPDATE users SET role = 'admin' WHERE email = $1 AND role != 'admin'`,
        [adminEmail]
      );
      if (result.rowCount && result.rowCount > 0) {
        logger.info(`✅ Compte ${adminEmail} promu admin`);
      }

      // Migration : si l'admin vient d'être recréé avec un nouvel UUID,
      // réattache l'ancien vault config orphelin pour préserver les données.
      const adminUser = await pool.query(
        `SELECT id FROM users WHERE email = $1`, [adminEmail]
      );
      if (adminUser.rows.length > 0) {
        const newId = adminUser.rows[0].id;
        // Cherche les vault configs orphelines (sans utilisateur correspondant)
        const orphans = await pool.query(
          `SELECT admin_id FROM admin_vault_config
           WHERE admin_id NOT IN (SELECT id FROM users)`
        );
        if (orphans.rows.length > 1) {
          // Plusieurs orphelins : impossible de savoir lequel appartient à
          // l'admin actuel sans risquer de rattacher/écraser la mauvaise clé.
          // On ne touche à rien et on demande une intervention manuelle.
          logger.warn(
            `⚠️ Plusieurs vault configs orphelines détectées (${orphans.rows.length}) — ` +
            `réattachement automatique désactivé, intervention manuelle requise`,
            { orphanIds: orphans.rows.map((r) => r.admin_id) }
          );
        } else if (orphans.rows.length === 1) {
          const oldId = orphans.rows[0].admin_id;
          const hasConfig = await pool.query(
            `SELECT 1 FROM admin_vault_config WHERE admin_id = $1`, [newId]
          );
          if (hasConfig.rows.length === 0) {
            // Nouveau compte sans config : réattache l'orphelin
            await pool.query(
              `UPDATE admin_vault_config SET admin_id = $1 WHERE admin_id = $2`,
              [newId, oldId]
            );
            await AdminVaultModel.updateMany({ adminId: oldId }, { adminId: newId });
            logger.info(`✅ Vault config + items MongoDB réattachés (${oldId} → ${newId})`);
          } else {
            // Nouveau compte a déjà sa propre config : ne jamais supprimer la
            // clé orpheline (les items MongoDB associés deviendraient
            // définitivement indéchiffrables). On journalise pour une
            // décision manuelle (fusion/export/suppression volontaire).
            logger.warn(
              `⚠️ Vault config orpheline (${oldId}) coexiste avec la config actuelle (${newId}) — ` +
              `conservée telle quelle, aucune suppression automatique`
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
  }
};

void starServer();