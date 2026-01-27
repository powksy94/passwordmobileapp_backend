import { NextFunction, Request, Response } from "express";
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

export function updateRole(arg0: string, authMiddleware: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined, arg2: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>, updateRole: any) {
    throw new Error("Function not implemented.");
}
