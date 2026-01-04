import { Router } from "express";
import * as ctrl from "../controllers/generatorController";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.post("/", ctrl.generatePassword);

export default router;
