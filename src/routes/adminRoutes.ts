import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';
import * as ctrl from '../controllers/adminController.js';
import * as vaultCtrl from '../controllers/adminVaultController.js';

const router = Router();

// ── Gestion utilisateurs ──────────────────────────────────────────────────────
router.get('/users', authMiddleware, roleMiddleware('admin'), ctrl.getAllUsers);
router.post('/role', authMiddleware, roleMiddleware('admin'), ctrl.updateRole);

// ── Vault admin ───────────────────────────────────────────────────────────────
// Auth biométrique (push FCM)
router.post('/vault/auth',                authMiddleware, roleMiddleware('admin'), vaultCtrl.requestVaultAuth);
router.post('/vault/auth/respond',        authMiddleware, roleMiddleware('admin'), vaultCtrl.respondVaultAuth);
router.get('/vault/auth/:sessionId',      authMiddleware, roleMiddleware('admin'), vaultCtrl.checkVaultAuthStatus);

// CRUD vault
router.get('/vault',    authMiddleware, roleMiddleware('admin'), vaultCtrl.getAdminVault);
router.post('/vault',   authMiddleware, roleMiddleware('admin'), vaultCtrl.createAdminVaultItem);
router.delete('/vault/:id', authMiddleware, roleMiddleware('admin'), vaultCtrl.deleteAdminVaultItem);

export default router;
