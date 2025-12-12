// routes/vaultRoutes.js
import express from "express";
import auth from "../middleware/auth.js";
import * as ctrl from "../controllers/vaultController.js";

const router = express.Router();

router.get("/", auth, ctrl.getAll);
router.post("/", auth, ctrl.create);
router.delete("/:id", auth, ctrl.deleteItem);

export default router;
