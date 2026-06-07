import { Request, Response } from "express";
import * as AuditRepo from "./audit.repo.js";

export const getAuditLogs = async (req: Request, res: Response) => {
  const logs = await AuditRepo.getAllLogs();
  res.json(logs);
};
