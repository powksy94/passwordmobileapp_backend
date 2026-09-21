/**
 * Admin account creation script.
 * Usage: npx ts-node --esm src/seed/create_admin.ts
 *
 * Variables to set before running:
 *   ADMIN_EMAIL    : admin account email
 *   ADMIN_PASSWORD : password (will be hashed with bcrypt)
 */
import bcrypt from 'bcrypt';
import { pool } from '../config/postgres.js';
import { connectMongo } from '../config/mongo.js';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'matthieuuzan@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

if (!ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD not set. Use: ADMIN_PASSWORD=xxx npx ts-node --esm src/seed/create_admin.ts');
  process.exit(1);
}

async function createAdmin() {
  await pool.connect();

  // Creates the table if missing (just in case)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      salt TEXT,
      fcm_token TEXT
    )
  `);

  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]
  );

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

  if (existing.rows.length > 0) {
    await pool.query(
      "UPDATE users SET password = $1, role = 'admin' WHERE email = $2",
      [hashed, ADMIN_EMAIL]
    );
    console.log(`✅ Admin account updated: ${ADMIN_EMAIL}`);
  } else {
    await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin')",
      [ADMIN_EMAIL, hashed]
    );
    console.log(`✅ Admin account created: ${ADMIN_EMAIL}`);
  }

  await pool.end();
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
