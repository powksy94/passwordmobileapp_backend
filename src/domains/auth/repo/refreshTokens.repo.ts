import { pool } from "../../../shared/config/postgres";

// Only a SHA-256 hash of each refresh token is stored: a database leak
// does not hand out usable sessions.
export interface RefreshTokenRow {
  id: string;
  user_id: string;
  family_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export const insertRefreshToken = async (
  userId: string,
  familyId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<string> => {
  const res = await pool.query<{ id: string }>(
    `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [userId, familyId, tokenHash, expiresAt]
  );
  return res.rows[0].id;
};

export const findRefreshTokenByHash = async (tokenHash: string): Promise<RefreshTokenRow | null> => {
  const res = await pool.query<RefreshTokenRow>(
    "SELECT id, user_id, family_id, token_hash, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1",
    [tokenHash]
  );
  return res.rows[0] ?? null;
};

// Atomic "revoke if still active": returns false when a concurrent request
// already rotated this token, so the same token can never be rotated twice.
export const revokeRefreshToken = async (id: string): Promise<boolean> => {
  const res = await pool.query(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL",
    [id]
  );
  return (res.rowCount ?? 0) > 0;
};

export const revokeRefreshTokenFamily = async (familyId: string): Promise<void> => {
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE family_id = $1 AND revoked_at IS NULL",
    [familyId]
  );
};

export const revokeAllRefreshTokensForUser = async (userId: string): Promise<void> => {
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId]
  );
};

// Keeps revoked rows a while so that reuse of a stolen token is still
// detected (and its family killed) shortly after rotation.
export const deleteStaleRefreshTokens = async (): Promise<number> => {
  const res = await pool.query(
    `DELETE FROM refresh_tokens
     WHERE expires_at < NOW() OR revoked_at < NOW() - INTERVAL '30 days'`
  );
  return res.rowCount ?? 0;
};
