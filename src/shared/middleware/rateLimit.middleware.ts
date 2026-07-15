import { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  windowStart: number;
}

// Limiteur en mémoire (fenêtre glissante simplifiée). Suffisant pour une
// seule instance ; à remplacer par un store partagé (Redis) si le backend
// est un jour répliqué horizontalement.
export const rateLimit = (options: { windowMs: number; max: number; keyFn?: (req: Request) => string }) => {
  const { windowMs, max, keyFn } = options;
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn ? keyFn(req) : req.ip ?? "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart > windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (bucket.count >= max) {
      res.status(429).json({ error: "Too many requests, please try again later." });
      return;
    }

    bucket.count += 1;
    next();
  };
};
