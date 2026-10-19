import { pool } from "../../../shared/config/postgres";

// Refresh tokens of the mobile app sessions (see session.service.ts).
// ON DELETE CASCADE: deleting an account removes its sessions.
export const migrateRefreshTokens = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      family_id  UUID NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    "CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON refresh_tokens (family_id)"
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id)"
  );
};
