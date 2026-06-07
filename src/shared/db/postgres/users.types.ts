// users.types.ts
export type UserRole = "admin" | "user" | "team_admin";

export interface User {
  salt: any;
  id: string;
  email: string;
  password: string;
  role: UserRole;
}
