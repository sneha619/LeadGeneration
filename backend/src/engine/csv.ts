import type { EnrichedLead } from "../types/lead.js";

const CSV_COLUMNS = [
  "companyName",
  "website",
  "industry",
  "location",
  "estimatedRevenue",
  "employeeCount",
  "leadScore",
  "scoreTier",
  "scoringReasons",
  "status",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(values: readonly unknown[]): string {
  return values.map(escapeCsvField).join(",");
}

export function buildLeadsCsv(leads: EnrichedLead[]): string {
  const header = buildCsvRow(CSV_COLUMNS);
  const rows = leads.map((lead) =>
    buildCsvRow([
      lead.companyName,
      lead.website,
      lead.industry,
      lead.location,
      lead.estimatedRevenue,
      lead.employeeCount,
      lead.leadScore,
      lead.scoreTier,
      lead.scoreReasons.join("; "),
      lead.status,
      lead.notes,
      lead.createdAt,
      lead.updatedAt,
    ]),
  );
  return [header, ...rows].join("\r\n") + "\r\n";
}

export const CSV_HEADERS = CSV_COLUMNS;
