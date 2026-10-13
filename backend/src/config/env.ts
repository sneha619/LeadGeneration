import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? "development";

const config = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  dbPath: process.env.DB_PATH ?? "./data/leads.db",
  // In production (Vercel), default to the frontend domain so CORS works even
  // if CORS_ORIGIN is not explicitly configured in Vercel env vars.
  // Override by setting CORS_ORIGIN in Vercel environment variables.
  corsOrigin: process.env.CORS_ORIGIN ?? (
    nodeEnv === "production"
      ? "https://frontend-nine-pink-70.vercel.app"
      : "http://localhost:5173"
  ),
} as const;

export default config;

