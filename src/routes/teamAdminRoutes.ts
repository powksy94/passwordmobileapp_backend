import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import * as ctrl from "../controllers/teamAdminController";

const router = Router();

router.post("/add_member", authMiddleware, roleMiddleware("team_admin"), ctrl.addMember);

export default router;
