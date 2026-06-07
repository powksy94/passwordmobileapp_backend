import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { roleMiddleware } from '../../shared/middleware/role.middleware.js';
import * as ctrl from './adminController.js';

const router = Router();

// ── Gestion utilisateurs ──────────────────────────────────────────────────────
router.get('/users', authMiddleware, roleMiddleware('admin'), ctrl.getAllUsers);
router.post('/role', authMiddleware, roleMiddleware('admin'), ctrl.updateRole);

export default router;
