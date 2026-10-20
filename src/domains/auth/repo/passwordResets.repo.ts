import { pool } from "../../../shared/config/postgres";

// Only an HMAC of each code is stored (see passwordReset.service.ts).
export interface PasswordResetCodeRow {
  id: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  created_at: Date;
}

// A new request replaces any pending code: only the latest one emailed works.
export const replacePendingCode = async (
  userId: string,
  codeHash: string,
  expiresAt: Date
): Promise<void> => {
  await pool.query(
    "DELETE FROM password_reset_codes WHERE user_id = $1 AND consumed_at IS NULL",
    [userId]
  );
  await pool.query(
    "INSERT INTO password_reset_codes (user_id, code_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, codeHash, expiresAt]
  );
};

export const findPendingCode = async (userId: string): Promise<PasswordResetCodeRow | null> => {
  const res = await pool.query<PasswordResetCodeRow>(
    `SELECT id, code_hash, expires_at, attempts, created_at FROM password_reset_codes
     WHERE user_id = $1 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return res.rows[0] ?? null;
};

export const incrementAttempts = async (id: string): Promise<void> => {
  await pool.query("UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = $1", [id]);
};

// Atomic: false if a concurrent request already used this code.
export const consumeCode = async (id: string): Promise<boolean> => {
  const res = await pool.query(
    "UPDATE password_reset_codes SET consumed_at = NOW() WHERE id = $1 AND consumed_at IS NULL",
    [id]
  );
  return (res.rowCount ?? 0) > 0;
};

export const deleteStaleCodes = async (): Promise<number> => {
  const res = await pool.query(
    "DELETE FROM password_reset_codes WHERE expires_at < NOW() - INTERVAL '1 day'"
  );
  return res.rowCount ?? 0;
};
