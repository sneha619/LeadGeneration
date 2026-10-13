import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import {
  getAllLeads,
  getDistinctIndustries,
  getDistinctLocations,
  getDistinctStatuses,
  getLeadById,
  updateLeadStatus,
  updateLeadNotes,
} from "../repositories/leadRepository.js";
import {
  scoreLead,
  DEFAULT_TARGET_CRITERIA,
  DEFAULT_WEIGHTS,
} from "../engine/scoring.js";
import { detectDuplicates, getMissingFields } from "../engine/duplicates.js";
import { buildLeadsCsv } from "../engine/csv.js";
import type { EnrichedLead, TargetCriteria } from "../types/lead.js";
import { LeadStatusSchema } from "../types/lead.js";

const router = Router();

const sortBySchema = z.enum(["companyName", "estimatedRevenue", "employeeCount", "leadScore"]);
const sortDirSchema = z.enum(["asc", "desc"]);

const parseList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

const LeadsQuerySchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  minRevenue: z.coerce.number().int().nonnegative().optional(),
  maxRevenue: z.coerce.number().int().nonnegative().optional(),
  minEmployees: z.coerce.number().int().nonnegative().optional(),
  maxEmployees: z.coerce.number().int().nonnegative().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  status: z.string().optional(),
  sortBy: sortBySchema.optional(),
  sortDir: sortDirSchema.optional(),
  targetMinRevenue: z.coerce.number().int().nonnegative().optional(),
  targetMaxRevenue: z.coerce.number().int().nonnegative().optional(),
  preferredIndustries: z.string().optional(),
  targetMinEmployees: z.coerce.number().int().nonnegative().optional(),
  targetMaxEmployees: z.coerce.number().int().nonnegative().optional(),
  preferredLocations: z.string().optional(),
});

export function buildCriteria(query: z.infer<typeof LeadsQuerySchema>): TargetCriteria {
  return {
    targetMinRevenue: query.targetMinRevenue ?? DEFAULT_TARGET_CRITERIA.targetMinRevenue,
    targetMaxRevenue: query.targetMaxRevenue ?? DEFAULT_TARGET_CRITERIA.targetMaxRevenue,
    preferredIndustries: parseList(query.preferredIndustries).length > 0
      ? parseList(query.preferredIndustries)
      : DEFAULT_TARGET_CRITERIA.preferredIndustries,
    targetMinEmployees: query.targetMinEmployees ?? DEFAULT_TARGET_CRITERIA.targetMinEmployees,
    targetMaxEmployees: query.targetMaxEmployees ?? DEFAULT_TARGET_CRITERIA.targetMaxEmployees,
    preferredLocations: parseList(query.preferredLocations).length > 0
      ? parseList(query.preferredLocations)
      : DEFAULT_TARGET_CRITERIA.preferredLocations,
  };
}

function enrichLeads(leads: ReturnType<typeof getAllLeads>, criteria: TargetCriteria): EnrichedLead[] {
  const duplicateMap = detectDuplicates(leads);

  return leads.map((lead) => {
    const scored = scoreLead(lead, criteria, DEFAULT_WEIGHTS);
    const dup = duplicateMap.get(lead.id) ?? {
      isDuplicate: false,
      duplicateReason: null,
      duplicateGroupKey: null,
    };
    const missingFields = getMissingFields(lead);

    return {
      ...lead,
      leadScore: scored.leadScore,
      scoreTier: scored.scoreTier,
      scoreReasons: scored.breakdown.map((b) => `${b.criterion}: ${b.score}/100 (${b.reason})`),
      breakdown: scored.breakdown,
      missingFields,
      isDuplicate: dup.isDuplicate,
      duplicateReason: dup.duplicateReason,
      duplicateGroupKey: dup.duplicateGroupKey,
    };
  });
}

function applyFilters(
  leads: EnrichedLead[],
  q: z.infer<typeof LeadsQuerySchema>,
): EnrichedLead[] {
  let result = leads;

  if (q.search) {
    const term = q.search.toLowerCase();
    result = result.filter((l) =>
      l.companyName.toLowerCase().includes(term) ||
      (l.website?.toLowerCase().includes(term) ?? false) ||
      (l.industry?.toLowerCase().includes(term) ?? false),
    );
  }

  if (q.industry) {
    result = result.filter((l) => l.industry?.toLowerCase() === q.industry!.toLowerCase());
  }

  if (q.location) {
    result = result.filter((l) => l.location?.toLowerCase() === q.location!.toLowerCase());
  }

  if (q.minRevenue !== undefined) {
    result = result.filter((l) => l.estimatedRevenue !== null && l.estimatedRevenue >= q.minRevenue!);
  }
  if (q.maxRevenue !== undefined) {
    result = result.filter((l) => l.estimatedRevenue !== null && l.estimatedRevenue <= q.maxRevenue!);
  }

  if (q.minEmployees !== undefined) {
    result = result.filter((l) => l.employeeCount !== null && l.employeeCount >= q.minEmployees!);
  }
  if (q.maxEmployees !== undefined) {
    result = result.filter((l) => l.employeeCount !== null && l.employeeCount <= q.maxEmployees!);
  }

  if (q.minScore !== undefined) {
    result = result.filter((l) => l.leadScore >= q.minScore!);
  }
  if (q.maxScore !== undefined) {
    result = result.filter((l) => l.leadScore <= q.maxScore!);
  }

  if (q.status) {
    result = result.filter((l) => l.status.toLowerCase() === q.status!.toLowerCase());
  }

  return result;
}

function applySorting(
  leads: EnrichedLead[],
  sortBy?: z.infer<typeof sortBySchema>,
  sortDir?: z.infer<typeof sortDirSchema>,
): EnrichedLead[] {
  const dir = sortDir === "asc" ? 1 : -1;

  if (!sortBy) {
    return [...leads].sort((a, b) => b.leadScore - a.leadScore || a.companyName.localeCompare(b.companyName));
  }

  return [...leads].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "companyName":
        cmp = a.companyName.localeCompare(b.companyName);
        break;
      case "estimatedRevenue":
        cmp = (a.estimatedRevenue ?? -1) - (b.estimatedRevenue ?? -1);
        break;
      case "employeeCount":
        cmp = (a.employeeCount ?? -1) - (b.employeeCount ?? -1);
        break;
      case "leadScore":
        cmp = a.leadScore - b.leadScore;
        break;
    }
    return cmp * dir;
  });
}

router.get("/leads/export", (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = LeadsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
      return;
    }

    const q = parsed.data;
    const criteria = buildCriteria(q);

    const allLeads = getAllLeads();
    const enriched = enrichLeads(allLeads, criteria);
    const filtered = applyFilters(enriched, q);
    const sorted = applySorting(filtered, q.sortBy, q.sortDir);

    if (sorted.length === 0) {
      res.status(204).send();
      return;
    }

    const csv = buildLeadsCsv(sorted);
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="saasquatch-leads-${date}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
});

router.get("/leads/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = getLeadById(req.params.id);
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const allLeads = getAllLeads();
    const enriched = enrichLeads(allLeads, DEFAULT_TARGET_CRITERIA);
    const enrichedLead = enriched.find((l) => l.id === lead.id) ?? null;

    res.status(200).json({ data: enrichedLead });
  } catch (err) {
    next(err);
  }
});

const StatusUpdateSchema = z.object({
  status: LeadStatusSchema,
});

router.patch("/leads/:id/status", (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = StatusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status", details: parsed.error.flatten() });
      return;
    }

    const existing = getLeadById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const updated = updateLeadStatus(req.params.id, parsed.data.status);
    if (!updated) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

const NotesUpdateSchema = z.object({
  notes: z.string().nullable(),
});

router.patch("/leads/:id/notes", (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = NotesUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid notes", details: parsed.error.flatten() });
      return;
    }

    const existing = getLeadById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const updated = updateLeadNotes(req.params.id, parsed.data.notes);
    if (!updated) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

router.get("/leads", (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = LeadsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
      return;
    }

    const q = parsed.data;
    const criteria = buildCriteria(q);

    const allLeads = getAllLeads();
    const enriched = enrichLeads(allLeads, criteria);
    const filtered = applyFilters(enriched, q);
    const sorted = applySorting(filtered, q.sortBy, q.sortDir);

    const facets = {
      industries: getDistinctIndustries(),
      locations: getDistinctLocations(),
      statuses: getDistinctStatuses(),
    };

    res.status(200).json({
      data: sorted,
      count: sorted.length,
      total: allLeads.length,
      facets,
      criteria,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
