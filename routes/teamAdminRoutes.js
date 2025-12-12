// routes/teamAdminRoutes.js
import express from "express";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import * as ctrl from "../controllers/teamAdminController.js";

const router = express.Router();

router.post(
  "/add_member",
  auth,
  authorize("team_admin"),
  ctrl.addMember
);

export default router;
