import { Router } from "express";
import { addVaultItem, getVault, updateVaultItem, deleteVaultItem, purgeVault } from "../controller/vaultController";
import { reencryptVault } from "../controller/vaultReencryptController";
import { authMiddleware } from "../../../shared/middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.post("/",    authMiddleware, addVaultItem);
router.get("/",     authMiddleware, getVault);
// Must be declared before "/:id" so it is not interpreted as an id.
router.put("/reencrypt-all", authMiddleware, reencryptVault);
router.delete("/all",        authMiddleware, purgeVault);
router.put("/:id",  authMiddleware, updateVaultItem);
router.delete("/:id", authMiddleware, deleteVaultItem);


export default router;
