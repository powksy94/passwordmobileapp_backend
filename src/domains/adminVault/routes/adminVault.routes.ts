import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/auth.middleware.js';
import { roleMiddleware } from '../../../shared/middleware/role.middleware.js';
import * as vaultAuthCtrl from '../controller/adminVaultAuthController.js';
import * as vaultCtrl from '../controller/adminVaultController.js';

const router = Router();

// ── Vault admin ───────────────────────────────────────────────────────────────
// Auth biométrique (push FCM)
router.post('/vault/auth',                authMiddleware, roleMiddleware('admin'), vaultAuthCtrl.requestVaultAuth);
router.post('/vault/auth/respond',        authMiddleware,                         vaultAuthCtrl.respondVaultAuth);
router.get('/vault/auth/:sessionId',      authMiddleware, roleMiddleware('admin'), vaultAuthCtrl.checkVaultAuthStatus);

// CRUD vault
router.get('/vault',    authMiddleware, roleMiddleware('admin'), vaultCtrl.getAdminVault);
router.post('/vault',   authMiddleware, roleMiddleware('admin'), vaultCtrl.createAdminVaultItem);
router.delete('/vault/:id', authMiddleware, roleMiddleware('admin'), vaultCtrl.deleteAdminVaultItem);

export default router;
