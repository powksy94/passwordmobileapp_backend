import { Router } from "express";
import { addVaultItem, getVault, updateVaultItem, deleteVaultItem } from "../controllers/vaultController";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.post("/",    authMiddleware, addVaultItem);
router.get("/",     authMiddleware, getVault);
router.put("/:id",  authMiddleware, updateVaultItem);
router.delete("/:id", authMiddleware, deleteVaultItem);


export default router;
