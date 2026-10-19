import type { Request, Response } from "express";
import logger from "../../../shared/config/logger";
import * as SessionService from "../services/session.service.js";

// `code` lets the app tell a dead session (=> log in again) apart from a
// network failure (=> keep the session and retry later).
export const REFRESH_INVALID_CODE = "REFRESH_INVALID";

export const refresh = async (
  req: Request<{}, {}, { refreshToken?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "refreshToken is required" });
      return;
    }

    const result = await SessionService.refreshSession(refreshToken);
    if (!result.ok) {
      res.status(401).json({ error: "Invalid refresh token", code: REFRESH_INVALID_CODE });
      return;
    }
    res.status(200).json(result.session);
  } catch (error) {
    logger.error("Refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unknown or already revoked tokens are ignored: logging out must always
// succeed from the app's point of view.
export const logout = async (
  req: Request<{}, {}, { refreshToken?: string }>,
  res: Response
): Promise<void> => {
  try {
    if (req.body.refreshToken) await SessionService.revokeSession(req.body.refreshToken);
    res.status(204).send();
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
