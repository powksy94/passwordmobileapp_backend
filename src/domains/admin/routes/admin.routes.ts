import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/auth.middleware.js';
import { roleMiddleware } from '../../../shared/middleware/role.middleware.js';
import * as ctrl from '../controller/adminController.js';

const router = Router();

// ── Gestion utilisateurs ──────────────────────────────────────────────────────
router.get('/users', authMiddleware, roleMiddleware('admin'), ctrl.getAllUsers);
router.get('/users/:userId/vault-stats', authMiddleware, roleMiddleware('admin'), ctrl.getUserVaultStats);
router.post('/role', authMiddleware, roleMiddleware('admin'), ctrl.updateRole);

export default router;
