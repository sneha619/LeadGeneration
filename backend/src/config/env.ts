import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? "development";

const config = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  dbPath: process.env.DB_PATH ?? "./data/leads.db",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
} as const;

export default config;
