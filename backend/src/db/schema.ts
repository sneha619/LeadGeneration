import { getDb, saveDb } from "./connection.js";
import { LEAD_STATUSES } from "../types/lead.js";

export function initDb(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS lead_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      companyName TEXT NOT NULL,
      website TEXT,
      industry TEXT,
      location TEXT,
      estimatedRevenue INTEGER,
      employeeCount INTEGER,
      description TEXT,
      leadScore INTEGER NOT NULL DEFAULT 0,
      scoreTier TEXT NOT NULL DEFAULT 'Unrated',
      scoreReasons TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'New',
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
    CREATE INDEX IF NOT EXISTS idx_leads_leadScore ON leads(leadScore);
  `);

  const insertStatus = db.prepare("INSERT OR IGNORE INTO lead_statuses (name) VALUES (?)");
  for (const status of LEAD_STATUSES) {
    insertStatus.run([status]);
  }
  insertStatus.free();

  saveDb();
}
