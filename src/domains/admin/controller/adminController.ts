import { Request, Response } from "express";
import * as UsersRepo from "../../../shared/db/postgres/users.repo";
import * as AuditRepo from "../../audit/repo/audit.repo";
import * as VaultRepo from "../../vault/repo/vault.repo.js";
import logger from "../../../shared/config/logger";

// ---------------------
// GET ALL USERS
// ---------------------
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await UsersRepo.getAllUsers();
    res.json(users);
  } catch (err) {
    logger.error("Failed to fetch users", { error: err });
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

// ---------------------
// DELETE USER
// ---------------------
export const deleteUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    await UsersRepo.deleteUser(id);
    await AuditRepo.logAction(req.user.id, `Deleted user ${id}`);

    logger.info("User deleted", { adminId: req.user.id, deletedUserId: id });
    res.status(204).send();
  } catch (err) {
    logger.error("Failed to delete user", { error: err, adminId: req.user?.id });
    res.status(500).json({ message: "Failed to delete user." });
  }
};

// ---------------------
// GET USER VAULT STRENGTH STATS
// ---------------------
export const getUserVaultStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId } = req.params;
    const stats = await VaultRepo.getVaultStrengthStats(userId);
    res.status(200).json(stats);
  } catch (err) {
    logger.error("Failed to get user vault stats", { error: err, adminId: req.user?.id });
    res.status(500).json({ message: "Failed to get user vault stats." });
  }
};

// ---------------------
// UPDATE USER ROLE
// ---------------------
export const updateRole = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role are required." });
    }

    if (!["admin", "user", "team_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    await UsersRepo.updateUserRole(userId, role);
    await AuditRepo.logAction(req.user.id, `Updated role for user ${userId} to ${role}`);

    logger.info("User role updated", { adminId: req.user.id, targetUserId: userId, role });
    res.status(200).json({ message: "Role updated successfully." });
  } catch (err) {
    logger.error("Failed to update user role", { error: err, adminId: req.user?.id });
    res.status(500).json({ message: "Failed to update role." });
  }
};
