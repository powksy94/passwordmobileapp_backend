import { Request, Response, NextFunction, RequestHandler } from "express";
import * as UsersRepo from "../db/postgres/users.repo";

export const roleMiddleware = (role: string): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await UsersRepo.getUserById(userId);

    if (!user || user.role !== role) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
};
