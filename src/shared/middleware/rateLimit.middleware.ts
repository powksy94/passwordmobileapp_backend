import { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  windowStart: number;
}

// In-memory limiter (simplified sliding window). Sufficient for a
// single instance; to be replaced by a shared store (Redis) if the backend
// is ever replicated horizontally.
export const rateLimit = (options: { windowMs: number; max: number; keyFn?: (req: Request) => string }) => {
  const { windowMs, max, keyFn } = options;
  const buckets = new Map<string, Bucket>();

  // Purges expired windows so the Map does not grow indefinitely
  // (one entry per ip:email pair seen). unref(): does not keep the process alive.
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart > windowMs) buckets.delete(key);
    }
  }, windowMs).unref();

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
