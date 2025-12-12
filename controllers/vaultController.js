// controllers/vaultController.js
import pool from "../db/db.js";

const toBytea = (v) => (v ? Buffer.from(v, "base64") : null);

export const getAll = async (req, res) => {
  try {
    const r = await pool.query(
      `
      SELECT * FROM vault_items
      WHERE user_id=$1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json(
      r.rows.map((row) => ({
        ...row,
      title: row.title?.toString("base64"),
      login: row.login?.toString("base64"),
      password: row.password?.toString("base64"),
      notes: row.notes?.toString("base64"),
      iv: row.iv?.toString("base64"),
      tag: row.tag?.toString("base64")

      }))
    );
  } catch (e) {
    console.error("vaultController getAll error:", e);
    res.sendStatus(500);
  }
};

export const create = async (req, res) => {
  try {
    const { id, title, login, password, notes, iv, tag, icon } = req.body;

    await pool.query(
      `
      INSERT INTO vault_items
      (id,user_id,title,login,password,notes,iv,tag,icon)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        id,
        req.user.id,
        toBytea(title),
        toBytea(login),
        toBytea(password),
        toBytea(notes),
        toBytea(iv),
        toBytea(tag),
        icon,
      ]
    );

    res.sendStatus(201);
  } catch (e) {
    console.error("vaultController create error:", e);
    res.sendStatus(500);
  }
};

export const deleteItem = async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM vault_items
      WHERE id=$1 AND user_id=$2
      `,
      [req.params.id, req.user.id]
    );

    res.sendStatus(204);
  } catch (e) {
    console.error("vaultController delete error:", e);
    res.sendStatus(500);
  }
};
