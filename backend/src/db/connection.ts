import initSqlJs from "sql.js";
import type { Database, SqlJsStatic } from "sql.js";
import fs from "node:fs";
import path from "node:path";
import config from "../config/env.js";

let dbInstance: Database | null = null;
let SQL: SqlJsStatic | null = null;

async function ensureSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

export async function initDbConnection(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const sqlJs = await ensureSqlJs();
  const dbPath = path.resolve(config.dbPath);
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
  const dbPath = path.resolve(config.dbPath);
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
