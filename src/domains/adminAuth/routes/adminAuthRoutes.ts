import { Router } from 'express';
import {
  requestAdminAuth,
  respondAdminAuth,
  checkAdminAuthStatus,
} from '../controller/adminAuthController.js';
import { authMiddleware } from '../../../shared/middleware/auth.middleware.js';
import { rateLimit } from '../../../shared/middleware/rateLimit.middleware.js';

const router = Router();

// Anti push-bombing : 5 demandes / 15 min par IP+email ciblé
const adminAuthRequestRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: (req) => `${req.ip}:${(req.body as { email?: string })?.email ?? ""}`,
});

// Depuis le panel React (sans auth)
router.post('/request',          adminAuthRequestRateLimit, requestAdminAuth);
router.get('/status/:sessionId', checkAdminAuthStatus);

// Depuis l'app Flutter (avec auth)
router.post('/respond', authMiddleware, respondAdminAuth);

export default router;
