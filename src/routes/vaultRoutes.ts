import { Router } from "express";
import { addVaultItem, getVault, updateVaultItem, deleteVaultItem } from "../controllers/vaultController";
import { reencryptVault } from "../controllers/vaultReencryptController";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.post("/",    authMiddleware, addVaultItem);
router.get("/",     authMiddleware, getVault);
// Doit être déclarée avant "/:id" pour ne pas être interprétée comme un id.
router.put("/reencrypt-all", authMiddleware, reencryptVault);
router.put("/:id",  authMiddleware, updateVaultItem);
router.delete("/:id", authMiddleware, deleteVaultItem);


export default router;
