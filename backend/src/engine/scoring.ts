import type {
  Lead,
  ScoreBreakdownItem,
  ScoreTier,
  TargetCriteria,
} from "../types/lead.js";

export const DEFAULT_WEIGHTS = {
  revenue: 0.3,
  industry: 0.25,
  employees: 0.2,
  geographic: 0.15,
  completeness: 0.1,
} as const;

export const NEUTRAL_SCORE = 50;

export const DEFAULT_TARGET_CRITERIA: TargetCriteria = {
  targetMinRevenue: 10_000_000,
  targetMaxRevenue: 100_000_000,
  preferredIndustries: ["SaaS", "FinTech", "Data & Analytics", "Cybersecurity", "HealthTech"],
  targetMinEmployees: 50,
  targetMaxEmployees: 500,
  preferredLocations: ["USA", "United States", "Canada", "UK", "Germany"],
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const round = (value: number): number => Math.round(value * 100) / 100;

function scoreNumericRange(
  value: number | null,
  min: number | null,
  max: number | null,
  label: string,
  prefix: string = "",
): { score: number; reason: string } {
  if (value === null) {
    return {
      score: NEUTRAL_SCORE,
      reason: `${label} data missing — neutral score applied`,
    };
  }
  if (min === null && max === null) {
    return { score: NEUTRAL_SCORE, reason: `No target ${label.toLowerCase()} range defined — neutral` };
  }

  const lower = min ?? 0;
  const upper = max ?? value;

  if (value >= lower && value <= upper) {
    return { score: 100, reason: `${label} ${prefix}${value.toLocaleString("en-US")} falls within target range` };
  }
  if (value < lower) {
    const ratio = lower === 0 ? 0 : value / lower;
    const score = Math.round(clamp(ratio * 100, 0, 100));
    return {
      score,
      reason: `${label} ${prefix}${value.toLocaleString("en-US")} is below target minimum of ${prefix}${lower.toLocaleString("en-US")}`,
    };
  }
  return { score: 100, reason: `${label} ${prefix}${value.toLocaleString("en-US")} meets or exceeds target range` };
}

function scoreListMatch(
  value: string | null,
  preferred: string[],
  label: string,
  matchFn: (value: string, preferred: string) => boolean,
): { score: number; reason: string } {
  if (value === null) {
    return {
      score: NEUTRAL_SCORE,
      reason: `${label} data missing — neutral score applied`,
    };
  }
  if (preferred.length === 0) {
    return { score: NEUTRAL_SCORE, reason: `No preferred ${label.toLowerCase()} specified — neutral` };
  }
  const matched = preferred.find((p) => matchFn(value, p));
  if (matched) {
    return { score: 100, reason: `${label} "${value}" matches preferred "${matched}"` };
  }
  return { score: 0, reason: `${label} "${value}" is not in the preferred list` };
}

function caseInsensitiveContains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

function exactMatch(value: string, preferred: string): boolean {
  return value.trim().toLowerCase() === preferred.trim().toLowerCase();
}

export function scoreCompleteness(lead: Lead): { score: number; reason: string; missing: string[] } {
  const fields: Array<{ key: string; label: string; value: unknown }> = [
    { key: "website", label: "Website", value: lead.website },
    { key: "industry", label: "Industry", value: lead.industry },
    { key: "location", label: "Location", value: lead.location },
    { key: "estimatedRevenue", label: "Estimated Revenue", value: lead.estimatedRevenue },
    { key: "employeeCount", label: "Employee Count", value: lead.employeeCount },
    { key: "description", label: "Description", value: lead.description },
  ];

  const missing = fields.filter((f) => f.value === null || f.value === undefined || f.value === "").map((f) => f.label);
  const present = fields.length - missing.length;
  const score = Math.round((present / fields.length) * 100);

  return {
    score,
    reason:
      missing.length === 0
        ? `All qualification fields present (${present}/${fields.length})`
        : `${present}/${fields.length} qualification fields present; missing: ${missing.join(", ")}`,
    missing,
  };
}

export function tierFromScore(score: number): ScoreTier {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

export interface ScoredLeadResult {
  leadScore: number;
  scoreTier: ScoreTier;
  breakdown: ScoreBreakdownItem[];
}

export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const keys = ["revenue", "industry", "employees", "geographic", "completeness"] as const;
  const sanitized: Record<string, number> = {};
  let total = 0;

  for (const key of keys) {
    const val = weights[key];
    const num = typeof val === "number" && !isNaN(val) && val >= 0 ? val : 0;
    sanitized[key] = num;
    total += num;
  }

  if (total <= 0) {
    return { ...DEFAULT_WEIGHTS };
  }

  const normalized: Record<string, number> = {};
  for (const key of keys) {
    normalized[key] = sanitized[key] / total;
  }

  return normalized;
}

export function scoreLead(
  lead: Lead,
  criteria: TargetCriteria,
  weights: Record<string, number> = DEFAULT_WEIGHTS,
): ScoredLeadResult {
  const normWeights = normalizeWeights(weights);

  const revenue = scoreNumericRange(
    lead.estimatedRevenue,
    criteria.targetMinRevenue,
    criteria.targetMaxRevenue,
    "Revenue",
    "$",
  );

  const industry = scoreListMatch(
    lead.industry,
    criteria.preferredIndustries,
    "Industry",
    exactMatch,
  );

  const employees = scoreNumericRange(
    lead.employeeCount,
    criteria.targetMinEmployees,
    criteria.targetMaxEmployees,
    "Employee count",
  );

  const geographic = scoreListMatch(
    lead.location,
    criteria.preferredLocations,
    "Location",
    caseInsensitiveContains,
  );

  const completeness = scoreCompleteness(lead);

  const items: Array<{ criterion: string; score: number; weight: number; reason: string }> = [
    { criterion: "Revenue Fit", score: revenue.score, weight: normWeights.revenue, reason: revenue.reason },
    { criterion: "Industry Fit", score: industry.score, weight: normWeights.industry, reason: industry.reason },
    { criterion: "Employee Count Fit", score: employees.score, weight: normWeights.employees, reason: employees.reason },
    { criterion: "Geographic Fit", score: geographic.score, weight: normWeights.geographic, reason: geographic.reason },
    { criterion: "Data Completeness", score: completeness.score, weight: normWeights.completeness, reason: completeness.reason },
  ];

  const breakdown: ScoreBreakdownItem[] = items.map((item) => ({
    criterion: item.criterion,
    score: item.score,
    weight: round(item.weight),
    contribution: round(item.score * item.weight),
    reason: item.reason,
  }));

  const total = breakdown.reduce((sum, b) => sum + b.contribution, 0);
  const leadScore = Math.round(clamp(total, 0, 100));

  return {
    leadScore,
    scoreTier: tierFromScore(leadScore),
    breakdown,
  };
}

export function scoreLeads(
  leads: Lead[],
  criteria: TargetCriteria,
  weights?: Record<string, number>,
): Array<Lead & ScoredLeadResult> {
  return leads.map((lead) => {
    const scored = scoreLead(lead, criteria, weights);
    return { ...lead, ...scored };
  });
}
