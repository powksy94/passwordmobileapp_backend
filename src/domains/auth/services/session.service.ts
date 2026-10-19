import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import {
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_TTL_DAYS,
} from "../../../shared/config/env";
import * as RefreshTokensRepo from "../repo/refreshTokens.repo.js";
import * as UsersRepo from "../../../shared/db/postgres/users.repo";
import logger from "../../../shared/config/logger";

export interface SessionTokens {
  token: string;
  refreshToken: string;
  role: string;
}

export type RefreshResult =
  | { ok: true; session: SessionTokens }
  | { ok: false; reason: "unknown" | "expired" | "reused" | "user_missing" };

// A revoked token presented again within this window is most likely the
// app retrying a refresh whose response was lost (or two refreshes racing):
// rejected, but without killing the whole session family.
const REUSE_GRACE_MS = 30_000;

const hashToken = (raw: string): string =>
  crypto.createHash("sha256").update(raw).digest("hex");

const signAccessToken = (user: { id: string; role: string }): string => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not defined");
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

const issueRefreshToken = async (userId: string, familyId: string): Promise<string> => {
  const raw = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 3_600_000);
  await RefreshTokensRepo.insertRefreshToken(userId, familyId, hashToken(raw), expiresAt);
  return raw;
};

//New login on a device: starts a new refresh token family.
export const createSession = async (user: { id: string; role: string }): Promise<SessionTokens> => ({
  token: signAccessToken(user),
  refreshToken: await issueRefreshToken(user.id, crypto.randomUUID()),
  role: user.role,
});

//Rotates [rawRefreshToken]: revokes it and issues a new pair in the same
//family. Presenting an already-rotated token (outside the grace window)
//means it leaked: the whole family is revoked, logging out both the
//attacker and the legitimate device.
export const refreshSession = async (rawRefreshToken: string): Promise<RefreshResult> => {
  const row = await RefreshTokensRepo.findRefreshTokenByHash(hashToken(rawRefreshToken));
  if (!row) return { ok: false, reason: "unknown" };

  if (row.revoked_at) {
    if (Date.now() - new Date(row.revoked_at).getTime() > REUSE_GRACE_MS) {
      await RefreshTokensRepo.revokeRefreshTokenFamily(row.family_id);
      logger.warn("Refresh token reuse detected - session family revoked", {
        userId: row.user_id,
        familyId: row.family_id,
      });
    }
    return { ok: false, reason: "reused" };
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) return { ok: false, reason: "expired" };

  // Lost the race against a concurrent rotation of the same token.
  if (!(await RefreshTokensRepo.revokeRefreshToken(row.id))) return { ok: false, reason: "reused" };

  // Role re-read from the database: a role change applies at the next refresh.
  const user = await UsersRepo.getUserById(row.user_id);
  if (!user) {
    await RefreshTokensRepo.revokeRefreshTokenFamily(row.family_id);
    return { ok: false, reason: "user_missing" };
  }

  return {
    ok: true,
    session: {
      token: signAccessToken(user),
      refreshToken: await issueRefreshToken(user.id, row.family_id),
      role: user.role,
    },
  };
};

//Explicit logout of one device: revokes its family. Unknown tokens are
//ignored (logout must always succeed from the app's point of view).
export const revokeSession = async (rawRefreshToken: string): Promise<void> => {
  const row = await RefreshTokensRepo.findRefreshTokenByHash(hashToken(rawRefreshToken));
  if (row) await RefreshTokensRepo.revokeRefreshTokenFamily(row.family_id);
};

//Account password change: every other device must log in again.
export const revokeAllSessions = (userId: string): Promise<void> =>
  RefreshTokensRepo.revokeAllRefreshTokensForUser(userId);
