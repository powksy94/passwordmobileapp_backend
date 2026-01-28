import { Request, Response, NextFunction } from "express";

export const roleMiddleware =
  (requiredRole: "admin" | "user") =>
  (req: Request, res: Response, next: NextFunction): void => {
    // authMiddleware garantit req.user
    if (req.user?.role !== requiredRole) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
