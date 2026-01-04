import { Request, Response } from "express";
import crypto from "crypto";

export const generatePassword = (req: Request, res: Response) => {
  const length = Number(req.query.length) || 16;
  const password = crypto.randomBytes(length).toString("base64").slice(0, length);
  res.json({ password });
};
