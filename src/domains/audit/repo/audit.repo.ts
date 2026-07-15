import { pool } from "../../../shared/config/postgres.js";

export interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  created_at: Date;
}

export const logAction = async (userId: string, action: string) => {
  await pool.query(
    "INSERT INTO audit(user_id, action) VALUES($1, $2)",
    [userId, action]
  );
};

export const getAllLogs = async (): Promise<AuditLog[]> => {
  const res = await pool.query<AuditLog>(
    "SELECT * FROM audit ORDER BY created_at DESC"
  );
  return res.rows;
};

