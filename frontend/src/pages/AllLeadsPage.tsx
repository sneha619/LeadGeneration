import { useCallback, useEffect, useMemo, useState } from "react";
import { LeadTable } from "../components/leads/LeadTable";
import { LeadDetailPanel } from "../components/leads/LeadDetailPanel";
import { FilterBar, emptyFilters, type FilterState } from "../components/leads/FilterBar";
import { Pagination } from "../components/ui/Pagination";
import { fetchLeads, updateLeadStatus, exportLeadsCsv } from "../services/api";
import type { Lead, LeadsFacets, LeadQueryParams, LeadStatus, TargetCriteria } from "../types/lead";

interface AllLeadsPageProps { criteria: TargetCriteria; }
const EMPTY_FACETS: LeadsFacets = { industries: [], locations: [], statuses: [] };
const DEFAULT_PAGE_SIZE = 10;

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

export function AllLeadsPage({ criteria }: AllLeadsPageProps) {
  /* ── Remote data ───────────────────────────────────────────────────────── */
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facets, setFacets] = useState<LeadsFacets>(EMPTY_FACETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Filters / sort ────────────────────────────────────────────────────── */
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  /* ── Pagination ────────────────────────────────────────────────────────── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* ── Detail panel ──────────────────────────────────────────────────────── */
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  /* ── Status save state ─────────────────────────────────────────────────── */
  const [savingStatusIds, setSavingStatusIds] = useState<Set<string>>(new Set());
  const [statusErrorIds, setStatusErrorIds] = useState<Set<string>>(new Set());

  /* ── CSV export state ──────────────────────────────────────────────────── */
  const [exportState, setExportState] = useState<"idle" | "exporting" | "error">("idle");
  const [exportError, setExportError] = useState<string | null>(null);

  /* ── Load all matching leads from the API ──────────────────────────────── */
  const loadLeads = useCallback(() => {
    setLoading(true); setError(null);
    fetchLeads(buildQueryParams(filters, criteria))
      .then((res) => { setLeads(res.data); setTotalCount(res.total); setFacets(res.facets); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, criteria]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  /* Reset to page 1 whenever filters or page size change */
  useEffect(() => { setCurrentPage(1); }, [filters, pageSize]);

  /* ── Client-side pagination slice ─────────────────────────────────────── */
  const paginatedLeads = useMemo(
    () => leads.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [leads, currentPage, pageSize],
  );

  /* ── Status change ─────────────────────────────────────────────────────── */
  const handleStatusChange = useCallback(async (lead: Lead, newStatus: LeadStatus) => {
    setSavingStatusIds((p) => new Set(p).add(lead.id));
    setStatusErrorIds((p) => { const n = new Set(p); n.delete(lead.id); return n; });
    try {
      await updateLeadStatus(lead.id, newStatus);
      setLeads((p) => p.map((l) => l.id === lead.id ? { ...l, status: newStatus } : l));
      loadLeads();
    } catch { setStatusErrorIds((p) => new Set(p).add(lead.id)); }
    finally { setSavingStatusIds((p) => { const n = new Set(p); n.delete(lead.id); return n; }); }
  }, [loadLeads]);

  /* ── CSV export — exports ALL filtered records, not just current page ─── */
  const handleExportCsv = useCallback(async () => {
    if (leads.length === 0) { setExportError("No leads to export."); return; }
    setExportState("exporting"); setExportError(null);
    try { await exportLeadsCsv(buildQueryParams(filters, criteria)); setExportState("idle"); }
    catch (err) { setExportError(err instanceof Error ? err.message : "Export failed"); setExportState("error"); }
  }, [leads.length, filters, criteria]);

  const selectedLead = useMemo(() => leads.find((l) => l.id === selectedLeadId) ?? null, [leads, selectedLeadId]);

  return (
    <div className="p-6 space-y-5">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">All Leads</h1>
          <p className="text-sm text-text-secondary mt-1">
            {loading
              ? "Loading…"
              : `${totalCount} leads · search, filter, sort, and manage`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exportError && <span className="text-xs text-status-error">{exportError}</span>}
          <button
            type="button" onClick={handleExportCsv}
            disabled={exportState === "exporting" || leads.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {exportState === "exporting" ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Exporting…</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Export CSV</>
            )}
          </button>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <FilterBar filters={filters} facets={facets} onChange={setFilters} onClear={() => setFilters(emptyFilters)} />

      {/* ── Lead table (paginated slice) ──────────────────────────────────── */}
      <LeadTable
        leads={paginatedLeads}
        loading={loading}
        error={error}
        totalCount={totalCount}
        onViewLead={(l) => setSelectedLeadId(l.id)}
        onStatusChange={handleStatusChange}
        savingStatusIds={savingStatusIds}
        statusErrorIds={statusErrorIds}
      />

      {/* ── Pagination footer ─────────────────────────────────────────────── */}
      {!loading && !error && leads.length > 0 && (
        <Pagination
          totalItems={leads.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* ── Detail panel ─────────────────────────────────────────────────── */}
      {selectedLead && (
        <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} onUpdated={loadLeads} />
      )}
    </div>
  );
}
