// users.types.ts
export type UserRole = "admin" | "user" | "team_admin";

export interface User {
  salt: any;
  id: string;
  email: string;
  password: string;
  role: UserRole;
  fcm_token?: string | null;
  locale: 'en' | 'fr' | 'es';
  weak_reminders_enabled: boolean;
  weak_reminders_include_medium: boolean;
  weak_reminder_delays_hours: number[];
}
