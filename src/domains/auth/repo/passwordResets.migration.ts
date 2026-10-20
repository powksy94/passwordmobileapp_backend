import { pool } from "../../../shared/config/postgres";

// One-time codes of the "forgot password" flow (see passwordReset.service.ts).
// ON DELETE CASCADE: deleting an account removes its pending codes.
// TIMESTAMPTZ: expiry checks must not depend on the Node/Postgres timezones.
export const migratePasswordResets = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash   TEXT NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      attempts    INTEGER NOT NULL DEFAULT 0,
      consumed_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    "CREATE INDEX IF NOT EXISTS password_reset_codes_user_idx ON password_reset_codes (user_id)"
  );
};
