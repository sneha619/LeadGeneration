import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { MetricCard } from "../components/ui/MetricCard";
import { LeadTable } from "../components/leads/LeadTable";
import { LeadDetailPanel } from "../components/leads/LeadDetailPanel";
import { FilterBar, emptyFilters, type FilterState } from "../components/leads/FilterBar";
import { TargetCriteriaPanel } from "../components/leads/TargetCriteriaPanel";
import { fetchLeads, updateLeadStatus, exportLeadsCsv } from "../services/api";
import type { Lead, LeadsFacets, LeadQueryParams, LeadStatus, TargetCriteria } from "../types/lead";

const DEFAULT_CRITERIA: TargetCriteria = {
  targetMinRevenue: 10_000_000,
  targetMaxRevenue: 100_000_000,
  preferredIndustries: ["SaaS", "FinTech", "Data & Analytics", "Cybersecurity", "HealthTech"],
  targetMinEmployees: 50,
  targetMaxEmployees: 500,
  preferredLocations: ["USA", "United States", "Canada", "UK", "Germany"],
};

const EMPTY_FACETS: LeadsFacets = { industries: [], locations: [], statuses: [] };

type ExportState = "idle" | "exporting" | "error";

function buildQueryParams(filters: FilterState, criteria: TargetCriteria): LeadQueryParams {
  return {
    search: filters.search || undefined,
    industry: filters.industry || undefined,
    location: filters.location || undefined,
    minRevenue: filters.minRevenue ? Number(filters.minRevenue) : undefined,
    maxRevenue: filters.maxRevenue ? Number(filters.maxRevenue) : undefined,
    minEmployees: filters.minEmployees ? Number(filters.minEmployees) : undefined,
    maxEmployees: filters.maxEmployees ? Number(filters.maxEmployees) : undefined,
    minScore: filters.minScore ? Number(filters.minScore) : undefined,
    maxScore: filters.maxScore ? Number(filters.maxScore) : undefined,
    status: filters.status || undefined,
    sortBy: (filters.sortBy || undefined) as LeadQueryParams["sortBy"],
    sortDir: filters.sortDir,
    targetMinRevenue: criteria.targetMinRevenue ?? undefined,
    targetMaxRevenue: criteria.targetMaxRevenue ?? undefined,
    preferredIndustries: criteria.preferredIndustries.length > 0 ? criteria.preferredIndustries.join(",") : undefined,
    targetMinEmployees: criteria.targetMinEmployees ?? undefined,
    targetMaxEmployees: criteria.targetMaxEmployees ?? undefined,
    preferredLocations: criteria.preferredLocations.length > 0 ? criteria.preferredLocations.join(",") : undefined,
  };
}

export function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facets, setFacets] = useState<LeadsFacets>(EMPTY_FACETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [criteria, setCriteria] = useState<TargetCriteria>(DEFAULT_CRITERIA);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [savingStatusIds, setSavingStatusIds] = useState<Set<string>>(new Set());
  const [statusErrorIds, setStatusErrorIds] = useState<Set<string>>(new Set());

  const [exportState, setExportState] = useState<ExportState>("idle");
  const [exportError, setExportError] = useState<string | null>(null);

  const loadLeads = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = buildQueryParams(filters, criteria);
    fetchLeads(params)
      .then((res) => {
        setLeads(res.data);
        setTotalCount(res.total);
        setFacets(res.facets);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, criteria]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleStatusChange = useCallback(
    async (lead: Lead, newStatus: LeadStatus) => {
      setSavingStatusIds((prev) => new Set(prev).add(lead.id));
      setStatusErrorIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
      try {
        await updateLeadStatus(lead.id, newStatus);
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)),
        );
        loadLeads();
      } catch (err) {
        setStatusErrorIds((prev) => new Set(prev).add(lead.id));
      } finally {
        setSavingStatusIds((prev) => {
          const next = new Set(prev);
          next.delete(lead.id);
          return next;
        });
      }
    },
    [loadLeads],
  );

  const handleExportCsv = useCallback(async () => {
    if (leads.length === 0) {
      setExportError("No leads to export for the current filters.");
      return;
    }
    setExportState("exporting");
    setExportError(null);
    try {
      const params = buildQueryParams(filters, criteria);
      await exportLeadsCsv(params);
      setExportState("idle");
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Failed to export CSV");
      setExportState("error");
    }
  }, [leads.length, filters, criteria]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const stats = useMemo(() => {
    const total = leads.length;
    const tierA = leads.filter((l) => l.scoreTier === "A").length;
    const tierB = leads.filter((l) => l.scoreTier === "B").length;
    const qualified = leads.filter((l) => l.status === "Qualified" || l.status === "Proposal").length;
    const avgScore = total > 0 ? Math.round(leads.reduce((s, l) => s + l.leadScore, 0) / total) : 0;
    const duplicates = leads.filter((l) => l.isDuplicate).length;
    return { total, tierA, tierB, qualified, avgScore, duplicates };
  }, [leads]);

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Lead Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track and prioritize your acquisition pipeline. Scores are computed from your target criteria. Data shown is synthetic.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Leads" value={stats.total} delta={`of ${totalCount} total`} deltaType="neutral" />
          <MetricCard label="Tier A (80–100)" value={stats.tierA} delta={`Tier B: ${stats.tierB}`} deltaType="positive" />
          <MetricCard label="In Pipeline" value={stats.qualified} delta="Qualified + Proposal" deltaType="neutral" />
          <MetricCard label="Avg Score" value={stats.avgScore} delta={`Duplicates: ${stats.duplicates}`} deltaType="neutral" />
        </div>

        <TargetCriteriaPanel
          criteria={criteria}
          onChange={setCriteria}
          onReset={() => setCriteria(DEFAULT_CRITERIA)}
        />

        <FilterBar
          filters={filters}
          facets={facets}
          onChange={setFilters}
          onClear={() => setFilters(emptyFilters)}
        />

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="text-base font-semibold text-slate-900">Leads</h3>
            <div className="flex items-center gap-3">
              {exportError && (
                <span className="text-xs text-rose-600">{exportError}</span>
              )}
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={exportState === "exporting" || leads.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                aria-label="Export leads to CSV"
              >
                {exportState === "exporting" ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Exporting…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </>
                )}
              </button>
              <span className="text-xs text-slate-400">
                {loading ? "—" : `${leads.length} of ${totalCount} records`}
              </span>
            </div>
          </div>
          <LeadTable
            leads={leads}
            loading={loading}
            error={error}
            totalCount={totalCount}
            onViewLead={(lead) => setSelectedLeadId(lead.id)}
            onStatusChange={handleStatusChange}
            savingStatusIds={savingStatusIds}
            statusErrorIds={statusErrorIds}
          />
        </div>
      </div>

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onUpdated={loadLeads}
        />
      )}
    </DashboardLayout>
  );
}
