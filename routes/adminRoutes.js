import { Router } from "express";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import * as ctrl from "../controllers/adminController.js";

const router = Router();

router.get("/users", auth, authorize("admin"), ctrl.listUsers);
router.post("/role", auth, authorize("admin"), ctrl.updateRole);

export default router;
