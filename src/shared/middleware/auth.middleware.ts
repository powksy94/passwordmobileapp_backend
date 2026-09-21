import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export const TOKEN_INVALID_CODE = "TOKEN_INVALID";

interface JwtPayload {
  id: string;
  role: "admin" | "user" | "team_admin";
  iat: number;
  exp: number;
}

export const authMiddleware = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // `code` permet au client de distinguer un token invalide/expiré (=> se
  // reconnecter) des autres 401 métier (ex. mauvais mot de passe actuel).
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Authorization header missing", code: TOKEN_INVALID_CODE });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "Token missing", code: TOKEN_INVALID_CODE });

  try {
    const payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;

    req.user = 
    { 
      id: payload.id,
      role: payload.role,
     };
     
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token", code: TOKEN_INVALID_CODE });
  }
};
