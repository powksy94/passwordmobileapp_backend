import { Router } from "express";
import { register, login, updateFcmToken, changePassword, deleteAccount } from "./authController";
import { authMiddleware } from "../../shared/middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login",    login);
router.post("/fcm-token",       authMiddleware, updateFcmToken);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/account",       authMiddleware, deleteAccount);

export default router;
