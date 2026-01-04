import dotenv from "dotenv";
dotenv.config();

export const {
  PORT,
  NODE_ENV,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CRYPTO_MASTER_KEY
} = process.env;
