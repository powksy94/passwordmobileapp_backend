import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import bcrypt from "bcrypt";
import { pool } from "../config/postgres";
import * as UsersRepo from "../db/postgres/users.repo";
import { revokeAllSessions } from "../../domains/auth/services/session.service";
import { isValidAccountPassword } from "../utils/passwordPolicy";

// Admin support: sets a temporary account (login) password for a user who
// forgot it, and logs out all their devices. The vault is untouched: it is
// encrypted with the master password, which never reaches the server.
// Verify the user's identity BEFORE running this.
//
// Usage: npm run reset-user-password <email>

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run reset-user-password <email>");
  process.exit(1);
}

// No look-alike characters (0/O, 1/l/I): the password is read out to the user.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*?";

const generateTemporaryPassword = (): string => {
  for (;;) {
    const candidate = Array.from({ length: 16 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
    if (isValidAccountPassword(candidate)) return candidate;
  }
};

async function resetUserPassword() {
  const user = await UsersRepo.getUserByEmail(email);
  if (!user) throw new Error(`No user found with email: ${email}`);

  const temporaryPassword = generateTemporaryPassword();
  await UsersRepo.updateUserPassword(user.id, await bcrypt.hash(temporaryPassword, 12));
  await revokeAllSessions(user.id);

  console.log(`✅ Password reset for ${user.email} (${user.id}), all sessions revoked.`);
  console.log(`Temporary password: ${temporaryPassword}`);
  console.log("Ask the user to change it in Settings > Change password after logging in.");
}

resetUserPassword()
  .catch((err) => {
    console.error("Error:", err instanceof Error && err.message ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
