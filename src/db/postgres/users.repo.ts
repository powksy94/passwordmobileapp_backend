import { pool } from "../../config/postgres";
import type { User } from "./users.types";

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const res = await pool.query<User>("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return res.rows[0] ?? null;
};

export const createUser = async (
  email: string,
  password: string,
  salt: string,
): Promise<User> => {
  const res = await pool.query<User>(
    "INSERT INTO users (email, password, salt) VALUES ($1, $2, $3) RETURNING *",
    [email, password, salt],
  );
  return res.rows[0];
};

export const getUserById = async (id: string): Promise<User | null> => {
  const res = await pool.query<User>("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows[0] ?? null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const res = await pool.query<User>("SELECT * FROM users");
  return res.rows;
};

export const deleteUser = async (id: string): Promise<void> => {
  await pool.query("DELETE FROM users WHERE id = $1", [id]);
};

export const updateUserRole = async (userId: string, role: "admin" | "user"): Promise<void> => {
  await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
};
