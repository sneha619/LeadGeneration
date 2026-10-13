export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal"
  | "Closed Won"
  | "Closed Lost";

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Closed Won",
  "Closed Lost",
];

export type ScoreTier = "A" | "B" | "C" | "D" | "Unrated";

export interface ScoreBreakdownItem {
  criterion: string;
  score: number;
  weight: number;
  contribution: number;
  reason: string;
}

export interface TargetCriteria {
  targetMinRevenue: number | null;
  targetMaxRevenue: number | null;
  preferredIndustries: string[];
  targetMinEmployees: number | null;
  targetMaxEmployees: number | null;
  preferredLocations: string[];
}

export interface Lead {
  id: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  estimatedRevenue: number | null;
  employeeCount: number | null;
  description: string | null;
  leadScore: number;
  scoreTier: ScoreTier;
  scoreReasons: string[];
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  breakdown: ScoreBreakdownItem[];
  missingFields: string[];
  isDuplicate: boolean;
  duplicateReason: string | null;
  duplicateGroupKey: string | null;
}

export interface LeadsFacets {
  industries: string[];
  locations: string[];
  statuses: string[];
}

export interface LeadsResponse {
  data: Lead[];
  count: number;
  total: number;
  facets: LeadsFacets;
  criteria: TargetCriteria;
}

export interface LeadQueryParams {
  search?: string;
  industry?: string;
  location?: string;
  minRevenue?: number;
  maxRevenue?: number;
  minEmployees?: number;
  maxEmployees?: number;
  minScore?: number;
  maxScore?: number;
  status?: string;
  sortBy?: "companyName" | "estimatedRevenue" | "employeeCount" | "leadScore";
  sortDir?: "asc" | "desc";
  targetMinRevenue?: number;
  targetMaxRevenue?: number;
  preferredIndustries?: string;
  targetMinEmployees?: number;
  targetMaxEmployees?: number;
  preferredLocations?: string;
}
