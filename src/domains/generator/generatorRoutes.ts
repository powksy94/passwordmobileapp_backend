import { Router } from "express";
import * as ctrl from "./generatorController";
import { authMiddleware } from "../../shared/middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.post("/", ctrl.generatePassword);

export default router;
