import type { Lead } from "../types/lead.js";

const COMMON_SUFFIXES = [
  "inc",
  "incorporated",
  "llc",
  "ltd",
  "limited",
  "corp",
  "corporation",
  "co",
  "company",
  "group",
  "holdings",
  "solutions",
  "technologies",
  "tech",
  "labs",
  "ventures",
];

export function extractDomain(website: string | null): string | null {
  if (!website) return null;
  try {
    const url = new URL(website);
    let host = url.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    return host || null;
  } catch {
    const cleaned = website
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim();
    return cleaned || null;
  }
}

export function normalizeCompanyName(name: string): string {
  let normalized = name.toLowerCase().trim();
  normalized = normalized.replace(/[^a-z0-9\s]/g, " ");
  normalized = normalized.replace(/\s+/g, " ").trim();

  const tokens = normalized.split(" ").filter((t) => t.length > 0);
  const filtered = tokens.filter((t) => !COMMON_SUFFIXES.includes(t));

  return (filtered.length > 0 ? filtered : tokens).join(" ");
}

export function getDuplicateKey(lead: Lead): string | null {
  const domain = extractDomain(lead.website);
  if (domain) return `domain:${domain}`;

  const normalizedName = normalizeCompanyName(lead.companyName);
  if (normalizedName) return `name:${normalizedName}`;

  return null;
}

export interface DuplicateInfo {
  isDuplicate: boolean;
  duplicateReason: string | null;
  duplicateGroupKey: string | null;
}

export function detectDuplicates(leads: Lead[]): Map<string, DuplicateInfo> {
  const keyCounts = new Map<string, number>();
  const keySamples = new Map<string, string>();

  for (const lead of leads) {
    const key = getDuplicateKey(lead);
    if (!key) continue;
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    if (!keySamples.has(key)) {
      keySamples.set(key, lead.companyName);
    }
  }

  const result = new Map<string, DuplicateInfo>();

  for (const lead of leads) {
    const key = getDuplicateKey(lead);
    if (!key || (keyCounts.get(key) ?? 0) <= 1) {
      result.set(lead.id, {
        isDuplicate: false,
        duplicateReason: null,
        duplicateGroupKey: null,
      });
      continue;
    }

    const isDomain = key.startsWith("domain:");
    const matchValue = isDomain ? key.slice("domain:".length) : key.slice("name:".length);
    const otherCount = (keyCounts.get(key) ?? 1) - 1;
    const reason = isDomain
      ? `Shares website domain "${matchValue}" with ${otherCount} other record${otherCount === 1 ? "" : "s"}`
      : `Normalized company name "${matchValue}" matches ${otherCount} other record${otherCount === 1 ? "" : "s"}`;

    result.set(lead.id, {
      isDuplicate: true,
      duplicateReason: reason,
      duplicateGroupKey: key,
    });
  }

  return result;
}

export function getMissingFields(lead: Lead): string[] {
  const fields: Array<{ label: string; value: unknown }> = [
    { label: "Website", value: lead.website },
    { label: "Industry", value: lead.industry },
    { label: "Location", value: lead.location },
    { label: "Estimated Revenue", value: lead.estimatedRevenue },
    { label: "Employee Count", value: lead.employeeCount },
  ];

  return fields
    .filter((f) => f.value === null || f.value === undefined || f.value === "")
    .map((f) => f.label);
}
