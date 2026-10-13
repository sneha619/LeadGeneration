import { getDb, saveDb } from "../db/connection.js";
import type { Lead } from "../types/lead.js";

interface LeadRow {
  id: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  estimatedRevenue: number | null;
  employeeCount: number | null;
  description: string | null;
  leadScore: number;
  scoreTier: string;
  scoreReasons: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: LeadRow): Lead {
  let reasons: string[] = [];
  try {
    const parsed = JSON.parse(row.scoreReasons);
    if (Array.isArray(parsed)) {
      reasons = parsed.filter((r): r is string => typeof r === "string");
    }
  } catch {
    reasons = [];
  }

  return {
    id: row.id,
    companyName: row.companyName,
    website: row.website,
    industry: row.industry,
    location: row.location,
    estimatedRevenue: row.estimatedRevenue,
    employeeCount: row.employeeCount,
    description: row.description,
    leadScore: row.leadScore,
    scoreTier: row.scoreTier as Lead["scoreTier"],
    scoreReasons: reasons,
    status: row.status as Lead["status"],
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function getAllLeads(): Lead[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM leads ORDER BY leadScore DESC, companyName ASC");
  const leads: Lead[] = [];
  while (stmt.step()) {
    leads.push(mapRow(stmt.getAsObject() as unknown as LeadRow));
  }
  stmt.free();
  return leads;
}

export function getLeadCount(): number {
  const db = getDb();
  const stmt = db.prepare("SELECT COUNT(*) as n FROM leads");
  stmt.step();
  const { n } = stmt.getAsObject() as { n: number };
  stmt.free();
  return n;
}

export function getDistinctIndustries(): string[] {
  const db = getDb();
  const stmt = db.prepare("SELECT DISTINCT industry FROM leads WHERE industry IS NOT NULL AND industry != '' ORDER BY industry ASC");
  const values: string[] = [];
  while (stmt.step()) {
    const { industry } = stmt.getAsObject() as { industry: string };
    values.push(industry);
  }
  stmt.free();
  return values;
}

export function getDistinctLocations(): string[] {
  const db = getDb();
  const stmt = db.prepare("SELECT DISTINCT location FROM leads WHERE location IS NOT NULL AND location != '' ORDER BY location ASC");
  const values: string[] = [];
  while (stmt.step()) {
    const { location } = stmt.getAsObject() as { location: string };
    values.push(location);
  }
  stmt.free();
  return values;
}

export function getDistinctStatuses(): string[] {
  const db = getDb();
  const stmt = db.prepare("SELECT DISTINCT status FROM leads WHERE status IS NOT NULL AND status != '' ORDER BY status ASC");
  const values: string[] = [];
  while (stmt.step()) {
    const { status } = stmt.getAsObject() as { status: string };
    values.push(status);
  }
  stmt.free();
  return values;
}

export function getLeadById(id: string): Lead | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM leads WHERE id = ? LIMIT 1");
  stmt.bind([id]);
  let lead: Lead | null = null;
  if (stmt.step()) {
    lead = mapRow(stmt.getAsObject() as unknown as LeadRow);
  }
  stmt.free();
  return lead;
}

export function updateLeadStatus(id: string, status: string): Lead | null {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    "UPDATE leads SET status = ?, updatedAt = ? WHERE id = ?",
  );
  stmt.run([status, now, id]);
  stmt.free();
  saveDb();
  return getLeadById(id);
}

export function updateLeadNotes(id: string, notes: string | null): Lead | null {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    "UPDATE leads SET notes = ?, updatedAt = ? WHERE id = ?",
  );
  stmt.run([notes, now, id]);
  stmt.free();
  saveDb();
  return getLeadById(id);
}
