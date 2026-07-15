import { Request, Response, NextFunction } from "express";
import * as AuditRepo from "../repo/audit.repo";

export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    if (req.user) {
      AuditRepo.logAction(req.user.id, `${req.method} ${req.originalUrl} - ${res.statusCode}`)
        .catch(() => { /* l'audit ne doit jamais faire échouer la requête déjà terminée */ });
    }
  });
  next();
};
