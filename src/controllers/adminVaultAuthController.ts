import { Request, Response } from 'express';
import crypto from 'crypto';
import * as AdminVaultConfigRepo from '../db/postgres/admin-vault-config.repo.js';
import * as UsersRepo from '../db/postgres/users.repo.js';
import firebaseAdmin from '../config/firebase-admin.js';
import logger from '../config/logger.js';

// ── Sessions vault en mémoire (TTL 5 min) ─────────────────────────────────────

interface VaultSession {
  adminUserId: string;
  createdAt:   Date;
  status:      'pending' | 'approved' | 'denied';
  vaultKey?:   string; // rempli lors de l'approbation depuis l'app Flutter
}

const vaultSessions = new Map<string, VaultSession>();

setInterval(() => {
  const limit = Date.now() - 5 * 60 * 1000;
  for (const [id, s] of vaultSessions) {
    if (s.createdAt.getTime() < limit) vaultSessions.delete(id);
  }
}, 60_000);

// ── 1. POST /admin/vault/auth ─────────────────────────────────────────────────
// Déclenche une push FCM sur le téléphone admin → retourne { sessionId }

export const requestVaultAuth = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const sessionId = crypto.randomUUID();
  vaultSessions.set(sessionId, {
    adminUserId: req.user.id,
    createdAt:   new Date(),
    status:      'pending',
  });

  const fcmToken = await UsersRepo.getFcmToken(req.user.id);
  if (fcmToken) {
    try {
      await firebaseAdmin.messaging().send({
        token: fcmToken,
        data: { type: 'admin_vault_auth', sessionId },
        notification: {
          title: '🔐 Accès au vault admin',
          body:  'Une demande d\'accès au vault admin nécessite votre approbation',
        },
        android: { priority: 'high', notification: { channelId: 'admin_auth' } },
      });
    } catch (err) {
      logger.error('FCM vault auth failed:', err);
    }
  }

  res.status(200).json({ sessionId });
};

// ── 2. GET /admin/vault/auth/:sessionId ──────────────────────────────────────
// Polling depuis le panel React → retourne { status, vaultKey? }

export const checkVaultAuthStatus = async (req: Request, res: Response): Promise<void> => {
  const session = vaultSessions.get(req.params.sessionId);

  if (!session) { res.status(200).json({ status: 'expired' }); return; }

  const elapsed = Date.now() - session.createdAt.getTime();
  if (elapsed > 5 * 60 * 1000) {
    vaultSessions.delete(req.params.sessionId);
    res.status(200).json({ status: 'expired' });
    return;
  }

  if (session.status === 'denied') {
    vaultSessions.delete(req.params.sessionId);
    res.status(200).json({ status: 'denied' });
    return;
  }

  if (session.status === 'approved' && session.vaultKey) {
    const { vaultKey } = session;
    vaultSessions.delete(req.params.sessionId);
    res.status(200).json({ status: 'approved', vaultKey });
    return;
  }

  res.status(200).json({ status: 'pending' });
};

// ── 2b. POST /admin/vault/auth/respond ──────────────────────────────────────
// Appelé par l'app Flutter après approbation biométrique

export const respondVaultAuth = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { sessionId, approved } = req.body as { sessionId: string; approved: boolean };
  const session = vaultSessions.get(sessionId);

  if (!session) { res.status(404).json({ error: 'Session introuvable ou expirée' }); return; }
  if (session.adminUserId !== req.user.id) { res.status(403).json({ error: 'Forbidden' }); return; }

  if (!approved) {
    session.status = 'denied';
    res.status(200).json({ message: 'Refusé' });
    return;
  }

  // Récupère (ou génère) la vault key depuis la DB
  const config = await AdminVaultConfigRepo.getOrCreateConfig(req.user.id);
  session.status   = 'approved';
  session.vaultKey = config.vault_key;

  logger.info('Vault admin approuvé', { adminId: req.user.id, sessionId });
  res.status(200).json({ message: 'Approuvé' });
};
