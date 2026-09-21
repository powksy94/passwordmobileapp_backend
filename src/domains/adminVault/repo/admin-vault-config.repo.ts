import { pool } from '../../../shared/config/postgres.js';
import crypto from 'crypto';

interface AdminVaultConfig {
  admin_id:  string;
  vault_key: string; // base64 AES-256 (32 bytes), generated once
  vault_salt: string; // base64 (32 bytes), generated once
}

/** Gets or creates the admin's vault config (vault_key + salt). */
export const getOrCreateConfig = async (adminId: string): Promise<AdminVaultConfig> => {
  const existing = await pool.query<AdminVaultConfig>(
    'SELECT * FROM admin_vault_config WHERE admin_id = $1',
    [adminId]
  );
  if (existing.rows[0]) return existing.rows[0];

  // First time: generates key + salt
  const vault_key  = crypto.randomBytes(32).toString('base64');
  const vault_salt = crypto.randomBytes(32).toString('base64');

  const res = await pool.query<AdminVaultConfig>(
    'INSERT INTO admin_vault_config (admin_id, vault_key, vault_salt) VALUES ($1, $2, $3) RETURNING *',
    [adminId, vault_key, vault_salt]
  );
  return res.rows[0];
};

export const getConfig = async (adminId: string): Promise<AdminVaultConfig | null> => {
  const res = await pool.query<AdminVaultConfig>(
    'SELECT * FROM admin_vault_config WHERE admin_id = $1',
    [adminId]
  );
  return res.rows[0] ?? null;
};
