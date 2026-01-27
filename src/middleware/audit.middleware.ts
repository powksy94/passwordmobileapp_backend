import { Request, Response, NextFunction } from "express";
import * as AuditRepo from "../db/postgres/audit.repo";

export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", async () => {
    if (req.user) {
      await AuditRepo.logAction(req.user.id, `${req.method} ${req.originalUrl} - ${res.statusCode}`);
    }
  });
  next();
};
