import { Router } from "express";
import { register, login, updateFcmToken, changePassword, deleteAccount } from "../controller/authController";
import { refresh, logout } from "../controller/sessionController";
import { requestPasswordReset, confirmPasswordReset } from "../controller/passwordResetController";
import { getWeakReminderSettings, updateWeakReminderSettings } from "../controller/weakReminderSettingsController";
import { authMiddleware } from "../../../shared/middleware/auth.middleware";
import { rateLimit } from "../../../shared/middleware/rateLimit.middleware";

const router = Router();

// Anti-bruteforce: 10 attempts / 15 min per IP + email
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: (req) => `${req.ip}:${(req.body as { email?: string })?.email ?? ""}`,
});

// Refresh tokens are 256-bit random values (not guessable): this limit only
// caps a misbehaving client, generously enough for several devices per IP.
const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyFn: (req) => req.ip ?? "",
});

// Anti email-bombing: on top of the 60 s per-account cooldown, caps how many
// inboxes a single IP can flood with reset emails.
const resetRequestRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: (req) => req.ip ?? "",
});

// Codes also lock after 5 wrong attempts each (passwordReset.service.ts).
const resetConfirmRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: (req) => `${req.ip}:${(req.body as { email?: string })?.email ?? ""}`,
});

router.post("/register", register);
router.post("/login",    loginRateLimit, login);
router.post("/refresh",  refreshRateLimit, refresh);
router.post("/logout",   logout);
router.post("/password-reset/request", resetRequestRateLimit, requestPasswordReset);
router.post("/password-reset/confirm", resetConfirmRateLimit, confirmPasswordReset);
router.post("/fcm-token",       authMiddleware, updateFcmToken);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/account",       authMiddleware, deleteAccount);
router.get("/weak-reminder-settings", authMiddleware, getWeakReminderSettings);
router.put("/weak-reminder-settings", authMiddleware, updateWeakReminderSettings);

export default router;
