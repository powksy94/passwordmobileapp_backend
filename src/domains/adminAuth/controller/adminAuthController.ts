import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import * as UsersRepo from '../../../shared/db/postgres/users.repo.js';
import firebaseAdmin from '../../../shared/config/firebase-admin.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../../../shared/config/env.js';
import logger from '../../../shared/config/logger.js';

// ── In-memory sessions (5 min TTL, automatic cleanup) ──────────────────────────

interface AdminSession {
  userId:    string;
  createdAt: Date;
  status:    'pending' | 'approved' | 'denied';
}

const sessions = new Map<string, AdminSession>();

// Cleanup of the expired sessions every minute
setInterval(() => {
  const limit = Date.now() - 5 * 60 * 1000;
  for (const [id, s] of sessions) {
    if (s.createdAt.getTime() < limit) sessions.delete(id);
  }
}, 60_000);

// ── Request initiation (called from the React panel) ──────────────────

export const requestAdminAuth = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: 'Email requis' });
    return;
  }

  const user = await UsersRepo.getUserByEmail(email);

  // Generic response to avoid user enumeration
  if (!user || user.role !== 'admin') {
    res.status(200).json({ sessionId: crypto.randomUUID() });
    return;
  }

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    userId:    user.id,
    createdAt: new Date(),
    status:    'pending',
  });

  // Sending the FCM push notification
  const fcmToken = await UsersRepo.getFcmToken(user.id);
  const requestIp = req.ip ?? 'IP inconnue';

  if (!fcmToken) {
    logger.warn('FCM token missing for this user', { userId: user.id });
  } else {
    try {
      await firebaseAdmin.messaging().send({
        token: fcmToken,
        data: {
          type:      'admin_approval_request',
          sessionId,
          userId:    user.id,
          requestIp,
        },
        notification: {
          title: '🔐 Connexion admin',
          body:  `Tentative de connexion au dashboard admin depuis ${requestIp}. Si ce n'est pas vous, refusez.`,
        },
        android: {
          priority: 'high',
          notification: { channelId: 'admin_auth' },
        },
      });
      logger.info('Push notification sent', { userId: user.id, sessionId });
    } catch (err) {
      logger.error('FCM send failed:', err);
    }
  }

  res.status(200).json({ sessionId });
};

// ── Response from the Flutter app (approve or deny) ───────────────────────

export const respondAdminAuth = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { sessionId, approved } = req.body as { sessionId: string; approved: boolean };
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session introuvable ou expirée' });
    return;
  }

  if (session.userId !== req.user.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  session.status = approved ? 'approved' : 'denied';
  logger.info(`Admin session ${approved ? 'approved' : 'denied'}`, { sessionId });
  res.status(200).json({ message: 'Réponse enregistrée' });
};

// ── Polling from the React panel ─────────────────────────────────────────────

export const checkAdminAuthStatus = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(200).json({ status: 'expired' });
    return;
  }

  const elapsed = Date.now() - session.createdAt.getTime();
  if (elapsed > 5 * 60 * 1000) {
    sessions.delete(sessionId);
    res.status(200).json({ status: 'expired' });
    return;
  }

  if (session.status === 'denied') {
    sessions.delete(sessionId);
    res.status(200).json({ status: 'denied' });
    return;
  }

  if (session.status === 'approved') {
    const user = await UsersRepo.getUserById(session.userId);
    sessions.delete(sessionId);

    if (!user || !JWT_SECRET) {
      res.status(500).json({ error: 'Erreur interne' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] }
    );
    res.status(200).json({ status: 'approved', token });
    return;
  }

  res.status(200).json({ status: 'pending' });
};
