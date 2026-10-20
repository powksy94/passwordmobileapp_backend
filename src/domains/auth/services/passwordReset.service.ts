import crypto from "crypto";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "../../../shared/config/env";
import * as UsersRepo from "../../../shared/db/postgres/users.repo";
import * as PasswordResetsRepo from "../repo/passwordResets.repo.js";
import { buildPasswordResetEmail } from "../mail/passwordResetMessages.js";
import { sendMail } from "../../../shared/mail/mailer.js";
import { revokeAllSessions } from "./session.service.js";
import { isValidAccountPassword } from "../../../shared/utils/passwordPolicy";
import logger from "../../../shared/config/logger";

export const CODE_TTL_MINUTES = 15;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60_000;

export type ConfirmResult =
  | { ok: true }
  | { ok: false; reason: "invalid_code" | "weak_password" };

// A 6-digit code has only 10^6 values: a plain hash would be brute-forced
// instantly from a database leak. Keyed with a server secret, it is not.
const hashCode = (userId: string, code: string): string =>
  crypto.createHmac("sha256", JWT_SECRET).update(`${userId}:${code}`).digest("hex");

const generateCode = (): string => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

// Never tells whether the email exists (the controller always answers the
// same way): failures are only logged.
export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await UsersRepo.getUserByEmail(email.trim());
  if (!user) return;

  const pending = await PasswordResetsRepo.findPendingCode(user.id);
  if (pending && Date.now() - new Date(pending.created_at).getTime() < RESEND_COOLDOWN_MS) return;

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);
  await PasswordResetsRepo.replacePendingCode(user.id, hashCode(user.id, code), expiresAt);

  try {
    await sendMail({ to: user.email, ...buildPasswordResetEmail(user.locale, code, CODE_TTL_MINUTES) });
    logger.info("Password reset code sent", { userId: user.id });
  } catch (err) {
    logger.error("Password reset email failed", { userId: user.id, err });
  }
};

export const confirmPasswordReset = async (
  email: string,
  code: string,
  newPassword: string
): Promise<ConfirmResult> => {
  if (!isValidAccountPassword(newPassword)) return { ok: false, reason: "weak_password" };

  const user = await UsersRepo.getUserByEmail(email.trim());
  if (!user) return { ok: false, reason: "invalid_code" };

  const pending = await PasswordResetsRepo.findPendingCode(user.id);
  if (
    !pending ||
    new Date(pending.expires_at).getTime() <= Date.now() ||
    pending.attempts >= MAX_ATTEMPTS
  ) {
    return { ok: false, reason: "invalid_code" };
  }

  const expected = Buffer.from(pending.code_hash, "hex");
  const actual = Buffer.from(hashCode(user.id, code.replace(/\s/g, "")), "hex");
  if (!crypto.timingSafeEqual(expected, actual)) {
    await PasswordResetsRepo.incrementAttempts(pending.id);
    return { ok: false, reason: "invalid_code" };
  }

  if (!(await PasswordResetsRepo.consumeCode(pending.id))) return { ok: false, reason: "invalid_code" };

  await UsersRepo.updateUserPassword(user.id, await bcrypt.hash(newPassword, 12));
  await revokeAllSessions(user.id);
  logger.info("Password reset completed", { userId: user.id });
  return { ok: true };
};
