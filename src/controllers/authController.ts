import type { Request, Response } from "express";
import * as UsersRepo from "../db/postgres/users.repo";
import bcrypt from "bcrypt";               // ✅ correction
import * as jwt from "jsonwebtoken";      // ✅ TypeScript ESM compatible
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env";

interface AuthRequestBody {
  email: string;
  password: string;
}

export const login = async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
  const { email, password } = req.body;

  const user = await UsersRepo.getUserByEmail(email);
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid: boolean = await bcrypt.compare(password, user.password); // ✅ bcrypt
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  if (!JWT_SECRET) throw new Error("JWT_SECRET not defined");

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } // ✅ TypeScript comprend maintenant
  );

  res.json({ token });
};
