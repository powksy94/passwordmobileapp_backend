import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const getUserByEmailMock = jest.fn<(email: string) => Promise<any>>();
const updateUserPasswordMock = jest.fn<(id: string, hash: string) => Promise<void>>();
const replacePendingCodeMock = jest.fn<(userId: string, hash: string, expiresAt: Date) => Promise<void>>();
const findPendingCodeMock = jest.fn<(userId: string) => Promise<any>>();
const incrementAttemptsMock = jest.fn<(id: string) => Promise<void>>();
const consumeCodeMock = jest.fn<(id: string) => Promise<boolean>>();
const sendMailMock = jest.fn<(msg: any) => Promise<void>>();
const revokeAllSessionsMock = jest.fn<(userId: string) => Promise<void>>();

jest.mock("../../../shared/config/env", () => ({ JWT_SECRET: "test-secret" }));
jest.mock("../../../shared/config/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("../../../shared/db/postgres/users.repo", () => ({
  getUserByEmail: getUserByEmailMock,
  updateUserPassword: updateUserPasswordMock,
}));
jest.mock("../repo/passwordResets.repo.js", () => ({
  replacePendingCode: replacePendingCodeMock,
  findPendingCode: findPendingCodeMock,
  incrementAttempts: incrementAttemptsMock,
  consumeCode: consumeCodeMock,
}));
jest.mock("../../../shared/mail/mailer.js", () => ({ sendMail: sendMailMock }));
jest.mock("../services/session.service.js", () => ({ revokeAllSessions: revokeAllSessionsMock }));

import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  requestPasswordReset,
  confirmPasswordReset,
  MAX_ATTEMPTS,
} from "../services/passwordReset.service";

const USER = { id: "user-1", email: "user@test.com", locale: "fr" };
const STRONG = "NewPassw0rd!ok";
const hmac = (code: string) =>
  crypto.createHmac("sha256", "test-secret").update(`${USER.id}:${code}`).digest("hex");

const pending = (overrides: Record<string, unknown> = {}) => ({
  id: "code-1",
  code_hash: hmac("123456"),
  expires_at: new Date(Date.now() + 10 * 60_000),
  attempts: 0,
  created_at: new Date(Date.now() - 5 * 60_000),
  ...overrides,
});

describe("passwordReset.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUserByEmailMock.mockResolvedValue(USER);
    findPendingCodeMock.mockResolvedValue(null);
    consumeCodeMock.mockResolvedValue(true);
  });

  describe("requestPasswordReset", () => {
    it("emails a 6-digit code and stores only its HMAC", async () => {
      await requestPasswordReset("user@test.com");

      const mail = sendMailMock.mock.calls[0][0] as { to: string; text: string; subject: string };
      expect(mail.to).toBe(USER.email);
      expect(mail.subject).toBe("Votre code de réinitialisation");
      const code = mail.text.match(/\b\d{6}\b/)![0];

      const [userId, storedHash, expiresAt] = replacePendingCodeMock.mock.calls[0];
      expect(userId).toBe(USER.id);
      expect(storedHash).toBe(hmac(code));
      expect(storedHash).not.toContain(code);
      const minutes = (expiresAt.getTime() - Date.now()) / 60_000;
      expect(minutes).toBeGreaterThan(14.9);
      expect(minutes).toBeLessThanOrEqual(15);
    });

    it("does nothing for an unknown email", async () => {
      getUserByEmailMock.mockResolvedValue(null);

      await requestPasswordReset("nobody@test.com");

      expect(replacePendingCodeMock).not.toHaveBeenCalled();
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it("does not send a new code within the 60 s cooldown", async () => {
      findPendingCodeMock.mockResolvedValue(pending({ created_at: new Date(Date.now() - 10_000) }));

      await requestPasswordReset("user@test.com");

      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it("does not throw when the email cannot be sent", async () => {
      sendMailMock.mockRejectedValue(new Error("Resend down"));

      await expect(requestPasswordReset("user@test.com")).resolves.toBeUndefined();
    });
  });

  describe("confirmPasswordReset", () => {
    it("updates the password and revokes every session with the right code", async () => {
      findPendingCodeMock.mockResolvedValue(pending());

      const result = await confirmPasswordReset("user@test.com", "123 456", STRONG);

      expect(result).toEqual({ ok: true });
      expect(consumeCodeMock).toHaveBeenCalledWith("code-1");
      const [userId, hash] = updateUserPasswordMock.mock.calls[0];
      expect(userId).toBe(USER.id);
      expect(await bcrypt.compare(STRONG, hash)).toBe(true);
      expect(revokeAllSessionsMock).toHaveBeenCalledWith(USER.id);
    });

    it("counts a wrong code as an attempt", async () => {
      findPendingCodeMock.mockResolvedValue(pending());

      const result = await confirmPasswordReset("user@test.com", "000000", STRONG);

      expect(result).toEqual({ ok: false, reason: "invalid_code" });
      expect(incrementAttemptsMock).toHaveBeenCalledWith("code-1");
      expect(updateUserPasswordMock).not.toHaveBeenCalled();
    });

    it.each([
      ["expired", { expires_at: new Date(Date.now() - 1000) }],
      ["locked after too many attempts", { attempts: MAX_ATTEMPTS }],
    ])("rejects even the right code when it is %s", async (_label, overrides) => {
      findPendingCodeMock.mockResolvedValue(pending(overrides));

      const result = await confirmPasswordReset("user@test.com", "123456", STRONG);

      expect(result).toEqual({ ok: false, reason: "invalid_code" });
      expect(updateUserPasswordMock).not.toHaveBeenCalled();
    });

    it("rejects a weak new password before checking the code", async () => {
      const result = await confirmPasswordReset("user@test.com", "123456", "weak");

      expect(result).toEqual({ ok: false, reason: "weak_password" });
      expect(findPendingCodeMock).not.toHaveBeenCalled();
    });

    it("rejects when there is no pending code or no account", async () => {
      expect(await confirmPasswordReset("user@test.com", "123456", STRONG)).toEqual({
        ok: false,
        reason: "invalid_code",
      });
      getUserByEmailMock.mockResolvedValue(null);
      expect(await confirmPasswordReset("nobody@test.com", "123456", STRONG)).toEqual({
        ok: false,
        reason: "invalid_code",
      });
    });

    it("changes nothing when a concurrent request already used the code", async () => {
      findPendingCodeMock.mockResolvedValue(pending());
      consumeCodeMock.mockResolvedValue(false);

      const result = await confirmPasswordReset("user@test.com", "123456", STRONG);

      expect(result).toEqual({ ok: false, reason: "invalid_code" });
      expect(updateUserPasswordMock).not.toHaveBeenCalled();
    });
  });
});
