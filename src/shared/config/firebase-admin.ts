import admin from 'firebase-admin';
import { FIREBASE_SERVICE_ACCOUNT } from './env.js';
import logger from './logger.js';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(FIREBASE_SERVICE_ACCOUNT) as admin.ServiceAccount
      ),
    });
    logger.info('✅ Firebase Admin initialized');
  } catch (err) {
    logger.error('Firebase Admin init failed:', err);
  }
}

export default admin;
