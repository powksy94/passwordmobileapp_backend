import { pool } from "../../config/postgres.js";

export const logAction = async (userId: string, action: string) => {
  await pool.query(
    "INSERT INTO audit(user_id, action) VALUES($1, $2)",
    [userId, action]
  );
};
export function getAllLogs() {
  throw new Error("Function not implemented.");
}

