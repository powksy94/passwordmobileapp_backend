import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ message: "Internal server error" });
};
