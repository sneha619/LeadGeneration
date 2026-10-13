import { z } from "zod";

export const LeadStatusSchema = z.enum([
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Closed Won",
  "Closed Lost",
]);

export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const ScoreTierSchema = z.enum(["A", "B", "C", "D", "Unrated"]);
export type ScoreTier = z.infer<typeof ScoreTierSchema>;

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

export interface LeadScoring {
  leadScore: number;
  scoreTier: ScoreTier;
  breakdown: ScoreBreakdownItem[];
}

export interface DataQuality {
  missingFields: string[];
  isDuplicate: boolean;
  duplicateReason: string | null;
  duplicateGroupKey: string | null;
}

export interface EnrichedLead extends Lead {
  breakdown: ScoreBreakdownItem[];
  missingFields: string[];
  isDuplicate: boolean;
  duplicateReason: string | null;
  duplicateGroupKey: string | null;
}

export const LeadSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string().min(1),
  website: z.string().url().nullable(),
  industry: z.string().nullable(),
  location: z.string().nullable(),
  estimatedRevenue: z.number().int().nonnegative().nullable(),
  employeeCount: z.number().int().nonnegative().nullable(),
  description: z.string().nullable(),
  leadScore: z.number().int().min(0).max(100),
  scoreTier: ScoreTierSchema,
  scoreReasons: z.array(z.string()),
  status: LeadStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Lead = z.infer<typeof LeadSchema>;

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Closed Won",
  "Closed Lost",
];
