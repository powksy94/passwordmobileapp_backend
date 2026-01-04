import crypto from "crypto";
import { CRYPTO_MASTER_KEY } from "./env.js";

const ALGO = "aes-256-gcm";

export const encryptValue = (value: string) => {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(CRYPTO_MASTER_KEY!, "hex");
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedValue: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex")
  };
};

export const decryptValue = (encrypted: string, ivHex: string, tagHex: string) => {
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const key = Buffer.from(CRYPTO_MASTER_KEY!, "hex");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
};
