import type { User } from "../db/postgres/users.repo";

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, "id" | "role">;
    }
  }
}

export {};
