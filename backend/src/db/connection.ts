import type { Database, SqlJsStatic } from "sql.js";
import fs from "node:fs";
import path from "node:path";
import config from "../config/env.js";

let dbInstance: Database | null = null;
let SQL: SqlJsStatic | null = null;

async function ensureSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  // Use the pure-JS asm.js build to avoid WASM bundling/loading issues on Vercel.
  // Falls back to the default export (which loads WASM) in environments that support it.
  try {
    const { default: initSqlJs } = await import("sql.js/dist/sql-asm.js");
    SQL = await initSqlJs();
  } catch {
    const { default: initSqlJs } = await import("sql.js");
    SQL = await initSqlJs();
  }
  return SQL;
}

/**
 * Resolves the DB file path.
 * On Vercel (VERCEL=1 env var is set automatically), use /tmp which is the
 * only writable directory available in serverless functions. Locally, use
 * the configured path (defaults to ./data/leads.db).
 */
function resolveDbPath(): string {
  if (process.env.VERCEL === "1" || process.env.VERCEL) {
    return "/tmp/leads.db";
  }
  return path.resolve(config.dbPath);
}

export async function initDbConnection(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const sqlJs = await ensureSqlJs();
  const dbPath = resolveDbPath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    dbInstance = new sqlJs.Database(buffer);
  } else {
    dbInstance = new sqlJs.Database();
  }

  return dbInstance;
}

export function getDb(): Database {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDbConnection() first.");
  }
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  const dbPath = resolveDbPath();
  const data = dbInstance.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export function closeDb(): void {
  if (dbInstance) {
    saveDb();
    dbInstance.close();
    dbInstance = null;
  }
}

