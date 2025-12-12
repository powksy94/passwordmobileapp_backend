// routes/authRoutes.js
import express from "express";
import * as ctrl from "../controllers/authController.js";

const router = express.Router();

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);

export default router;
