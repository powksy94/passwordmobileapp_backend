// src/controllers/teamAdminController.ts
import { Request, Response } from "express";
import { pool } from "../config/postgres";
import logger from "../config/logger";

// Ajout d'un membre avec rôle "user"
export const addMember = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const result = await pool.query(
      "UPDATE users SET role='user' WHERE email=$1 AND role='team_admin'",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No team admin found with this email." });
    }

    logger.info("Team member added", { email });
    res.status(200).json({ message: "Member role updated successfully." });
  } catch (error) {
    logger.error("Failed to add team member", { error });
    res.status(500).json({ message: "Failed to add team member." });
  }
};
