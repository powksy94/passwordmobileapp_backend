import crypto from "crypto";
import { CRYPTO_MASTER_KEY } from "./env.js";

// Ensure the master key is defined in the environment
if (!CRYPTO_MASTER_KEY) {
  throw new Error("CRYPTO_MASTER_KEY is not defined in environment variables");
}

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(CRYPTO_MASTER_KEY, "hex");

/**
 * Encrypts a string using AES-256-GCM
 * @param value The plaintext string to encrypt
 * @returns An object containing encryptedValue, iv, and tag in hex
 */
export const encryptValue = (value: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptedValue: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
};

/**
 * Decrypts a string encrypted with AES-256-GCM
 * @param encrypted The encrypted string in hex
 * @param ivHex The initialization vector used during encryption (hex)
 * @param tagHex The authentication tag (hex)
 * @returns The decrypted plaintext string
 */
export const decryptValue = (encrypted: string, ivHex: string, tagHex: string) => {
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
