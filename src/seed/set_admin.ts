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
    console.error(`Aucun utilisateur trouvé avec l'email : ${email}`);
    process.exit(1);
  }

  console.log(`✅ ${email} est maintenant admin.`);
  await pool.end();
}

setAdmin().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
