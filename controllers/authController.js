// controllers/authController.js
import pool from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users(email, password_hash)
       VALUES($1, $2)`,
      [email, hash]
    );

    res.sendStatus(201);
  } catch (e) {
    console.error("register error:", e);
    res.sendStatus(500);
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const r = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (!r.rowCount) return res.sendStatus(401);

    const user = r.rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.sendStatus(401);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      token,
      role: user.role
    });
  } catch (e) {
    console.error("login error:", e);
    res.sendStatus(500);
  }
};
