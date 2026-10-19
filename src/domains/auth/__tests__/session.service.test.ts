import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const insertMock = jest.fn<(...args: any[]) => Promise<string>>();
const findMock = jest.fn<(hash: string) => Promise<any>>();
const revokeMock = jest.fn<(id: string) => Promise<boolean>>();
const revokeFamilyMock = jest.fn<(familyId: string) => Promise<void>>();
const revokeAllMock = jest.fn<(userId: string) => Promise<void>>();
const getUserByIdMock = jest.fn<(id: string) => Promise<any>>();

jest.mock("../../../shared/config/env", () => ({
  JWT_SECRET: "test-secret",
  ACCESS_TOKEN_EXPIRES_IN: "1h",
  REFRESH_TOKEN_TTL_DAYS: 60,
}));
jest.mock("../../../shared/config/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("../repo/refreshTokens.repo.js", () => ({
  insertRefreshToken: insertMock,
  findRefreshTokenByHash: findMock,
  revokeRefreshToken: revokeMock,
  revokeRefreshTokenFamily: revokeFamilyMock,
  revokeAllRefreshTokensForUser: revokeAllMock,
}));
jest.mock("../../../shared/db/postgres/users.repo", () => ({
  getUserById: getUserByIdMock,
}));

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createSession, refreshSession, revokeSession } from "../services/session.service";

const sha256 = (raw: string) => crypto.createHash("sha256").update(raw).digest("hex");
const USER = { id: "user-1", role: "user" };

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "row-1",
  user_id: USER.id,
  family_id: "family-1",
  token_hash: "hash",
  expires_at: new Date(Date.now() + 86_400_000),
  revoked_at: null,
  ...overrides,
});

describe("session.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insertMock.mockResolvedValue("new-row");
    revokeMock.mockResolvedValue(true);
    getUserByIdMock.mockResolvedValue(USER);
  });

  describe("createSession", () => {
    it("returns a valid access token and stores only the refresh token hash", async () => {
      const session = await createSession(USER);

      const payload = jwt.verify(session.token, "test-secret") as { id: string; role: string };
      expect(payload).toMatchObject({ id: USER.id, role: USER.role });
      expect(session.role).toBe("user");

      const [userId, , storedHash, expiresAt] = insertMock.mock.calls[0];
      expect(userId).toBe(USER.id);
      expect(storedHash).toBe(sha256(session.refreshToken));
      expect(storedHash).not.toBe(session.refreshToken);
      const days = ((expiresAt as Date).getTime() - Date.now()) / 86_400_000;
      expect(days).toBeGreaterThan(59.9);
    });

    it("starts a new family on every login", async () => {
      await createSession(USER);
      await createSession(USER);

      expect(insertMock.mock.calls[0][1]).not.toBe(insertMock.mock.calls[1][1]);
    });
  });

  describe("refreshSession", () => {
    it("rotates a valid token within the same family", async () => {
      findMock.mockResolvedValue(row());

      const result = await refreshSession("raw-token");

      expect(findMock).toHaveBeenCalledWith(sha256("raw-token"));
      expect(revokeMock).toHaveBeenCalledWith("row-1");
      expect(result.ok).toBe(true);
      expect(insertMock.mock.calls[0][1]).toBe("family-1");
    });

    it("reads the role from the database, not from the old session", async () => {
      findMock.mockResolvedValue(row());
      getUserByIdMock.mockResolvedValue({ ...USER, role: "team_admin" });

      const result = await refreshSession("raw-token");

      expect(result.ok && result.session.role).toBe("team_admin");
    });

    it("rejects an unknown token", async () => {
      findMock.mockResolvedValue(null);

      expect(await refreshSession("raw-token")).toEqual({ ok: false, reason: "unknown" });
      expect(insertMock).not.toHaveBeenCalled();
    });

    it("rejects an expired token", async () => {
      findMock.mockResolvedValue(row({ expires_at: new Date(Date.now() - 1000) }));

      expect(await refreshSession("raw-token")).toEqual({ ok: false, reason: "expired" });
      expect(insertMock).not.toHaveBeenCalled();
    });

    it("revokes the whole family when an old rotated token is reused", async () => {
      findMock.mockResolvedValue(row({ revoked_at: new Date(Date.now() - 60_000) }));

      expect(await refreshSession("raw-token")).toEqual({ ok: false, reason: "reused" });
      expect(revokeFamilyMock).toHaveBeenCalledWith("family-1");
    });

    it("does not kill the family for a reuse within the grace window (lost response retry)", async () => {
      findMock.mockResolvedValue(row({ revoked_at: new Date(Date.now() - 5_000) }));

      expect(await refreshSession("raw-token")).toEqual({ ok: false, reason: "reused" });
      expect(revokeFamilyMock).not.toHaveBeenCalled();
    });

    it("issues nothing when a concurrent request already rotated the token", async () => {
      findMock.mockResolvedValue(row());
      revokeMock.mockResolvedValue(false);

      expect(await refreshSession("raw-token")).toEqual({ ok: false, reason: "reused" });
      expect(insertMock).not.toHaveBeenCalled();
    });

    it("revokes the family when the user no longer exists", async () => {
      findMock.mockResolvedValue(row());
      getUserByIdMock.mockResolvedValue(null);

      expect(await refreshSession("raw-token")).toEqual({ ok: false, reason: "user_missing" });
      expect(revokeFamilyMock).toHaveBeenCalledWith("family-1");
    });
  });

  describe("revokeSession", () => {
    it("revokes the family of a known token", async () => {
      findMock.mockResolvedValue(row());

      await revokeSession("raw-token");

      expect(revokeFamilyMock).toHaveBeenCalledWith("family-1");
    });

    it("ignores an unknown token", async () => {
      findMock.mockResolvedValue(null);

      await revokeSession("raw-token");

      expect(revokeFamilyMock).not.toHaveBeenCalled();
    });
  });
});
