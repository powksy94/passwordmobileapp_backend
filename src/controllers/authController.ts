import type { Request, Response } from "express";
import * as UsersRepo from "../db/postgres/users.repo";
import bcrypt from "bcrypt"; // ✅ correction
import * as jwt from "jsonwebtoken"; // ✅ TypeScript ESM compatible
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env";
import type { SignOptions } from "jsonwebtoken";
import logger from "../config/logger";

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

    res.status(200).json({ token });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
