import { describe, it, expect } from "@jest/globals";
import { encryptValue, decryptValue } from "../../config/crypto";

describe("Crypto service", () => {
  it("should encrypt and decrypt correctly", () => {
    const secret = "my-super-secret";

    const encrypted = encryptValue(secret);

    expect(encrypted.encryptedValue).not.toBe(secret);

    const decrypted = decryptValue(
      encrypted.encryptedValue,
      encrypted.iv,
      encrypted.tag
    );

    expect(decrypted).toBe(secret);
  });

  it("should generate different ciphertexts for same value", () => {
    const value = "same-value";

    const a = encryptValue(value);
    const b = encryptValue(value);

    expect(a.encryptedValue).not.toBe(b.encryptedValue);
  });
});
