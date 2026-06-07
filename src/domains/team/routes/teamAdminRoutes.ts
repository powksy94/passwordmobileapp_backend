import { Router } from "express";
import { authMiddleware } from "../../../shared/middleware/auth.middleware";
import { roleMiddleware } from "../../../shared/middleware/role.middleware";
import * as ctrl from "../controller/teamAdminController";

const router = Router();

router.post("/add_member", authMiddleware, roleMiddleware("team_admin"), ctrl.addMember);

export default router;
