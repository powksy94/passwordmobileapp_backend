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
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";

export const CRYPTO_MASTER_KEY = process.env.CRYPTO_MASTER_KEY ?? "";
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

