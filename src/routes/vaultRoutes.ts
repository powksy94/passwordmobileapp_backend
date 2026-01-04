import { Router } from "express";
import { addVaultItem, getVault, deleteVaultItem } from "../controllers/vaultController";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.post("/", addVaultItem);
router.get("/", getVault);
router.delete("/:id", deleteVaultItem);

export default router;
