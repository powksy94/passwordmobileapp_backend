import { pool } from "../../config/postgres";
import type { User } from "./users.types";

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const res = await pool.query<User>(
    `SELECT * FROM users WHERE email = $1
     ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'team_admin' THEN 1 ELSE 2 END
     LIMIT 1`,
    [email],
  );
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

export const getAdminCount = async (): Promise<number> => {
  const res = await pool.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
  );
  return parseInt(res.rows[0].count, 10);
};

export const updateUserRole = async (userId: string, role: "admin" | "user" | "team_admin"): Promise<void> => {
  await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
};

export const updateUserPassword = async (id: string, hashedPassword: string): Promise<void> => {
  await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, id]);
};

export const updateFcmToken = async (
  id: string,
  fcmToken: string,
  locale?: 'en' | 'fr' | 'es'
): Promise<void> => {
  if (locale) {
    await pool.query("UPDATE users SET fcm_token = $1, locale = $2 WHERE id = $3", [fcmToken, locale, id]);
  } else {
    await pool.query("UPDATE users SET fcm_token = $1 WHERE id = $2", [fcmToken, id]);
  }
};

export const getFcmToken = async (id: string): Promise<string | null> => {
  const res = await pool.query<{ fcm_token: string | null }>(
    "SELECT fcm_token FROM users WHERE id = $1",
    [id]
  );
  return res.rows[0]?.fcm_token ?? null;
};

export interface WeakReminderSettings {
  enabled: boolean;
  includeMedium: boolean;
  delaysHours: number[];
}

export const getWeakReminderSettings = async (id: string): Promise<WeakReminderSettings | null> => {
  const res = await pool.query<{
    weak_reminders_enabled: boolean;
    weak_reminders_include_medium: boolean;
    weak_reminder_delays_hours: number[];
  }>(
    "SELECT weak_reminders_enabled, weak_reminders_include_medium, weak_reminder_delays_hours FROM users WHERE id = $1",
    [id]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    enabled: row.weak_reminders_enabled,
    includeMedium: row.weak_reminders_include_medium,
    delaysHours: row.weak_reminder_delays_hours,
  };
};

export const updateWeakReminderSettings = async (
  id: string,
  settings: WeakReminderSettings
): Promise<void> => {
  await pool.query(
    "UPDATE users SET weak_reminders_enabled = $1, weak_reminders_include_medium = $2, weak_reminder_delays_hours = $3 WHERE id = $4",
    [settings.enabled, settings.includeMedium, settings.delaysHours, id]
  );
};
