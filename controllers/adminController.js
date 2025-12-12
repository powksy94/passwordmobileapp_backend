// controllers/adminController.js
import pool from "../db/db.js";

export const listUsers = async (req, res) => {
  try {
    const r = await pool.query("SELECT id,email,role FROM users");
    res.json(r.rows);
  } catch (err) {
    console.error("listUsers error:", err);
    res.sendStatus(500);
  }
};

export const updateRole = async (req, res) => {
  const { userId, role } = req.body;

  try {
    await pool.query(
      `UPDATE users SET role=$1 WHERE id=$2`,
      [role, userId]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("updateRole error:", err);
    res.sendStatus(500);
  }
};
