import { Request, Response } from "express";
import * as AuditRepo from "../db/postgres/audit.repo.js";

export const getAuditLogs = async (req: Request, res: Response) => {
  const logs = await AuditRepo.getAllLogs();
  res.json(logs);
};
