import dotenv from "dotenv";
dotenv.config({ quiet: true});

export const PORT = process.env.PORT ?? "3000";

export const NODE_ENV = process.env.NODE_ENV ?? "developpement";

export const POSTGRES_HOST = process.env.POSTGRES_HOST ?? "localhost";
export const POSTGRES_PORT = Number(process.env.POSTGRES_PORT ?? 5432);
export const POSTGRES_USER = process.env.POSTGRES_USER ?? "postgres";
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "";
export const POSTGRES_DB  = process.env.POSTGRES_DB ?? "";

export const MONGO_URI = process.env.MONGO_URI ?? "";

export const JWT_SECRET = process.env.JWT_SECRET ?? "";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "30d";

// Mobile app sessions: short-lived access token, silently renewed with a
// rotating refresh token (see upgrade/REFRESH_TOKEN_SESSIONS.md). The
// sliding TTL is pushed back on every refresh, so an app in regular use
// never has to log in again.
export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1h";
export const REFRESH_TOKEN_TTL_DAYS  = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 60);

export const CRYPTO_MASTER_KEY        = process.env.CRYPTO_MASTER_KEY        ?? "";
export const CORS_ORIGIN              = process.env.CORS_ORIGIN              ?? "*";

// Number of reverse proxies in front of the app (Railway = 1). Without this `req.ip` is
// the proxy IP for all clients and the rate limit no longer tells anyone apart.
export const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS ?? 1);
export const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT ?? "{}";

