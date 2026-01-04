import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { roleMiddleware } from "../middleware/role.middleware.ts";
import * as ctrl from "../controllers/adminController.js";

const router = Router();

router.get("/users", authMiddleware, roleMiddleware("admin"), ctrl.getAllUsers);
router.post("/role", authMiddleware, roleMiddleware("admin"), ctrl.updateRole);

export default router;
