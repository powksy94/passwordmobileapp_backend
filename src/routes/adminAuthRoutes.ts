import { Router } from 'express';
import {
  requestAdminAuth,
  respondAdminAuth,
  checkAdminAuthStatus,
} from '../controllers/adminAuthController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Depuis le panel React (sans auth)
router.post('/request',          requestAdminAuth);
router.get('/status/:sessionId', checkAdminAuthStatus);

// Depuis l'app Flutter (avec auth)
router.post('/respond', authMiddleware, respondAdminAuth);

export default router;
