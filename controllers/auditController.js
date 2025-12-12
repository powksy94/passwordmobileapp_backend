// controllers/auditController.js
import pool from "../db/db.js";

export const log = async (user_id, action, details = {}) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs(user_id, action, metadata)
       VALUES($1, $2, $3)`,
      [user_id, action, details]
    );
  } catch (e) {
    console.error("audit log error:", e);
  }
};
