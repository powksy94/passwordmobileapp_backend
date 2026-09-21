import dotenv from "dotenv";
dotenv.config();

import { pool } from "../config/postgres";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run seed-admin <email>");
  process.exit(1);
}

async function setAdmin() {
  const res = await pool.query(
    "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, email, role",
    [email]
  );

  if (res.rowCount === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`✅ ${email} is now an admin.`);
  await pool.end();
}

setAdmin().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
