import type { Request, Response } from "express";
import * as UsersRepo from "../../shared/db/postgres/users.repo";
import bcrypt from "bcrypt"; // ✅ correction
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../../shared/config/env";
import type { SignOptions } from "jsonwebtoken";
import logger from "../../shared/config/logger";

interface AuthRequestBody {
  email: string;
  password: string;
}

export const login = async (
  req: Request<{}, {}, AuthRequestBody>,
  res: Response
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Vérification du body
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await UsersRepo.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      if (!JWT_SECRET) {
        throw new Error("JWT_SECRET not defined");
      }

      const signOptions: SignOptions = {
        expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
      };

      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        signOptions
      );

      res.status(200).json({ token, role: user.role, salt: user.salt });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  export const register = async (
    req: Request<{}, {}, {email: string; password: string, salt: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const { email, password, salt } = req.body;

      if (!email || !password || !salt) {
        res.status(400).json({ error: "Email, password and salt are required" });
        return;
      }

      const existing = await UsersRepo.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Email already exists"});
        return;
      }

      const hashed = await bcrypt.hash(password, 12);
      await UsersRepo.createUser(email, hashed, salt);

      res.status(201).json({ message: "User created" });
    } catch (error) {
      logger.error("Register error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

export const updateFcmToken = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { fcmToken } = req.body as { fcmToken?: string };
  if (!fcmToken) {
    res.status(400).json({ error: 'fcmToken requis' });
    return;
  }
  await UsersRepo.updateFcmToken(req.user.id, fcmToken);
  res.status(200).json({ message: 'FCM token enregistré' });
};

export const changePassword = async (
  req: Request<{}, {}, { currentPassword: string; newPassword: string }>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword are required" });
      return;
    }

    const user = await UsersRepo.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await UsersRepo.updateUserPassword(req.user.id, hashed);

    logger.info("Password changed", { userId: req.user.id });
    res.status(200).json({ message: "Password updated" });
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await UsersRepo.deleteUser(req.user.id);

    logger.info("Account deleted", { userId: req.user.id });
    res.status(204).send();
  } catch (error) {
    logger.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

