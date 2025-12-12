// controllers/teamAdminController.js
import authorize from "../middleware/auth.js"; // ← .js obligatoire
import pool from "../db/db.js";

export const addMember = async (req, res) => {
  try {
    const { email } = req.body;

    await pool.query(
      "UPDATE users SET role='user' WHERE email=$1 AND role='team_admin'",
      [email]
    );

    res.sendStatus(200);
  } catch (e) {
    console.error("teamAdminController error:", e);
    res.sendStatus(500);
  }
};
