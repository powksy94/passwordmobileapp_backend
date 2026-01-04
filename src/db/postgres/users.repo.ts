import { pool } from "../../config/postgres.js";

export const getUserByEmail = async (email: string) => {
  const res = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  return res.rows[0];
};

export const createUser = async (email: string, password: string) => {
  const res = await pool.query(
    "INSERT INTO users(email, password) VALUES($1, $2) RETURNING *",
    [email, password]
  );
  return res.rows[0];
};
export function deleteUser(id: string) {
  throw new Error("Function not implemented.");
}

export function getAllUsers() {
  throw new Error("Function not implemented.");
}

export function getUserById(userId: any) {
  throw new Error("Function not implemented.");
}

