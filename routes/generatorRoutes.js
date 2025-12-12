// routes/generatorRoutes.js
import express from "express";
import * as ctrl from "../controllers/generatorController.js";

const router = express.Router();

router.post("/", ctrl.generate);

export default router;
