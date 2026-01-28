import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

interface JwtPayload {
  id: string;
  role: "admin" | "user";
  iat: number;
  exp: number;
}

export const authMiddleware = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) 
    return res.status(401).json({ error: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) 
    return res.status(401).json({ error: "Token missing" });

  try {
    const payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;

    req.user = 
    { 
      id: payload.id,
      role: payload.role,
     };
     
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
