import { Router } from "express";
import { register, login, updateFcmToken, changePassword, deleteAccount } from "../controller/authController";
import { authMiddleware } from "../../../shared/middleware/auth.middleware";
import { rateLimit } from "../../../shared/middleware/rateLimit.middleware";

const router = Router();

// Anti-bruteforce : 10 tentatives / 15 min par IP+email
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: (req) => `${req.ip}:${(req.body as { email?: string })?.email ?? ""}`,
});

router.post("/register", register);
router.post("/login",    loginRateLimit, login);
router.post("/fcm-token",       authMiddleware, updateFcmToken);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/account",       authMiddleware, deleteAccount);

export default router;
