// users.types.ts
export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
}
