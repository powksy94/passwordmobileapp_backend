import type { Request, Response } from "express";
import logger from "../../../shared/config/logger";
import * as PasswordResetService from "../services/passwordReset.service.js";

// Same answer whether the email exists or not: the endpoint must not reveal
// which accounts exist.
export const requestPasswordReset = async (
  req: Request<{}, {}, { email?: string }>,
  res: Response
): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  try {
    await PasswordResetService.requestPasswordReset(email);
  } catch (error) {
    logger.error("Password reset request error:", error);
  }
  res.status(202).json({ message: "If this account exists, a code has been sent" });
};

// `code` lets the app show a translated message (the server text is never displayed).
export const confirmPasswordReset = async (
  req: Request<{}, {}, { email?: string; code?: string; newPassword?: string }>,
  res: Response
): Promise<void> => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: "email, code and newPassword are required" });
    return;
  }
  try {
    const result = await PasswordResetService.confirmPasswordReset(email, code, newPassword);
    if (!result.ok) {
      res.status(400).json({
        error: "Password reset failed",
        code: result.reason === "weak_password" ? "WEAK_PASSWORD" : "INVALID_CODE",
      });
      return;
    }
    res.status(200).json({ message: "Password updated" });
  } catch (error) {
    logger.error("Password reset confirm error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
