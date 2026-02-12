// users.types.ts
export type UserRole = "admin" | "user";

export interface User {
  salt: any;
  id: string;
  email: string;
  password: string;
  role: UserRole;
}
