import { Request, Response } from "express";
import * as UsersRepo from "../db/postgres/users.repo";
import * as AuditRepo from "../db/postgres/audit.repos";

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await UsersRepo.getAllUsers();
  res.json(users);
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await UsersRepo.deleteUser(id);
  await AuditRepo.logAction(req.user.id, `Deleted user ${id}`);
  res.status(204).send();
};