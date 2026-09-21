import { Router } from 'express';
import {
  requestAdminAuth,
  respondAdminAuth,
  checkAdminAuthStatus,
} from '../controller/adminAuthController.js';
import { authMiddleware } from '../../../shared/middleware/auth.middleware.js';
import { rateLimit } from '../../../shared/middleware/rateLimit.middleware.js';

const router = Router();

// Anti push-bombing: 5 requests / 15 min per IP + targeted email
const adminAuthRequestRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: (req) => `${req.ip}:${(req.body as { email?: string })?.email ?? ""}`,
});

// From the React panel (no auth)
router.post('/request',          adminAuthRequestRateLimit, requestAdminAuth);
router.get('/status/:sessionId', checkAdminAuthStatus);

// From the Flutter app (with auth)
router.post('/respond', authMiddleware, respondAdminAuth);

export default router;
