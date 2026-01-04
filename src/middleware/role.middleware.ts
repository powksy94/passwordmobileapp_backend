import { Request, Response, NextFunction } from "express";
import * as UsersRepo from "../db/postgres/users.repo";

export const roleMiddleware = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await UsersRepo.getUserById(userId);
    if (!user || user.role !== role) return res.status(403).json({ error: "Forbidden" });

    next();
  };
};
