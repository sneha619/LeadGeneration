import { useCallback, useEffect, useMemo, useState } from "react";
import { MetricCard } from "../components/ui/MetricCard";
import { LeadTable } from "../components/leads/LeadTable";
import { LeadDetailPanel } from "../components/leads/LeadDetailPanel";
import { FilterBar, emptyFilters, type FilterState } from "../components/leads/FilterBar";
import { fetchLeads, updateLeadStatus, exportLeadsCsv } from "../services/api";
import type { Lead, LeadsFacets, LeadQueryParams, LeadStatus, TargetCriteria } from "../types/lead";
import type { NavPage } from "../App";

interface DashboardPageProps {
  criteria: TargetCriteria;
  setCriteria: (c: TargetCriteria) => void;
  navigate: (page: NavPage) => void;
}

const EMPTY_FACETS: LeadsFacets = { industries: [], locations: [], statuses: [] };

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

type ExportState = "idle" | "exporting" | "error";

/* Shared button classes */
const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-base transition-colors";

const quickNavCards = [
  {
    page: "leads" as NavPage,
    label: "All Leads",
    desc: "Browse, filter, and sort the full database.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    accent: "border-accent/40 hover:border-accent",
  },
  {
    page: "prioritized" as NavPage,
    label: "Prioritized Leads",
    desc: "Focus on your highest-scoring opportunities.",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    accent: "border-status-success/40 hover:border-status-success",
  },
  {
    page: "pipeline" as NavPage,
    label: "Pipeline",
    desc: "Update statuses and track follow-ups.",
    icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2",
    accent: "border-status-warning/40 hover:border-status-warning",
  },
];

export function DashboardPage({ criteria, navigate }: DashboardPageProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facets, setFacets] = useState<LeadsFacets>(EMPTY_FACETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [savingStatusIds, setSavingStatusIds] = useState<Set<string>>(new Set());
  const [statusErrorIds, setStatusErrorIds] = useState<Set<string>>(new Set());
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [exportError, setExportError] = useState<string | null>(null);

  const loadLeads = useCallback(() => {
    setLoading(true); setError(null);
    fetchLeads(buildQueryParams(filters, criteria))
      .then((res) => { setLeads(res.data); setTotalCount(res.total); setFacets(res.facets); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, criteria]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

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

  const handleExportCsv = useCallback(async () => {
    if (leads.length === 0) { setExportError("No leads to export."); return; }
    setExportState("exporting"); setExportError(null);
    try { await exportLeadsCsv(buildQueryParams(filters, criteria)); setExportState("idle"); }
    catch (err) { setExportError(err instanceof Error ? err.message : "Export failed"); setExportState("error"); }
  }, [leads.length, filters, criteria]);

  const selectedLead = useMemo(() => leads.find((l) => l.id === selectedLeadId) ?? null, [leads, selectedLeadId]);

  const stats = useMemo(() => {
    const total = leads.length;
    const tierA = leads.filter((l) => l.scoreTier === "A").length;
    const tierB = leads.filter((l) => l.scoreTier === "B").length;
    const qualified = leads.filter((l) => l.status === "Qualified" || l.status === "Proposal").length;
    const avgScore = total > 0 ? Math.round(leads.reduce((s, l) => s + l.leadScore, 0) / total) : 0;
    const duplicates = leads.filter((l) => l.isDuplicate).length;
    return { total, tierA, tierB, qualified, avgScore, duplicates };
  }, [leads]);

  const scoreDist = useMemo(() => [
    { label: "80–100", count: leads.filter((l) => l.leadScore >= 80).length,  color: "bg-status-success", pct: 0 },
    { label: "60–79",  count: leads.filter((l) => l.leadScore >= 60 && l.leadScore < 80).length, color: "bg-accent",  pct: 0 },
    { label: "40–59",  count: leads.filter((l) => l.leadScore >= 40 && l.leadScore < 60).length, color: "bg-status-warning", pct: 0 },
    { label: "0–39",   count: leads.filter((l) => l.leadScore < 40).length,  color: "bg-surface-border", pct: 0 },
  ].map((b) => ({ ...b, pct: leads.length > 0 ? (b.count / leads.length) * 100 : 0 })),
  [leads]);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Acquisition pipeline overview — {loading ? "loading…" : `${totalCount} leads in database`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exportError && <span className="text-xs text-status-error">{exportError}</span>}
          <button type="button" onClick={handleExportCsv} disabled={exportState === "exporting" || leads.length === 0} className={btnPrimary}>
            {exportState === "exporting" ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Exporting…</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Export CSV</>
            )}
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Leads" value={loading ? "—" : stats.total}
          delta={!loading ? `of ${totalCount} in DB` : undefined} deltaType="neutral"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <MetricCard label="Tier A (High Priority)" value={loading ? "—" : stats.tierA}
          delta={!loading ? `+ ${stats.tierB} Tier B` : undefined} deltaType="positive"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
        />
        <MetricCard label="Qualified / Proposal" value={loading ? "—" : stats.qualified}
          delta="Active pipeline stage" deltaType="neutral"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard label="Potential Duplicates" value={loading ? "—" : stats.duplicates}
          delta={!loading && stats.duplicates > 0 ? "Review recommended" : "No issues found"}
          deltaType={stats.duplicates > 0 ? "negative" : "positive"}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
        />
      </div>

      {/* Score distribution */}
      {!loading && leads.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Score Distribution</h3>
            <span className="text-xs text-text-muted">Avg score: <span className="text-text-secondary font-semibold">{stats.avgScore}/100</span></span>
          </div>
          <div className="space-y-2.5">
            {scoreDist.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-12 text-right font-mono">{b.label}</span>
                <div className="flex-1 bg-surface-border/50 rounded-full h-2">
                  <div className={`h-2 rounded-full ${b.color} transition-all duration-700`} style={{ width: `${b.pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-text-secondary w-6 text-right tabular-nums">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick-nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickNavCards.map((card) => (
          <button
            key={card.page}
            type="button"
            onClick={() => navigate(card.page)}
            className={`text-left bg-surface-card border rounded-xl p-4 hover:bg-surface-hover transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-base group ${card.accent}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0 group-hover:bg-surface-hover transition-colors">
                <svg className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{card.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{card.desc}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">
              Go <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </span>
          </button>
        ))}
      </div>

      {/* Lead table section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Leads
            {!loading && <span className="ml-2 text-xs font-normal text-text-muted">{leads.length} shown</span>}
          </h3>
          <button type="button" onClick={() => navigate("leads")} className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
            View all →
          </button>
        </div>
        <FilterBar filters={filters} facets={facets} onChange={setFilters} onClear={() => setFilters(emptyFilters)} />
        <div className="mt-4">
          <LeadTable leads={leads} loading={loading} error={error} totalCount={totalCount}
            onViewLead={(l) => setSelectedLeadId(l.id)}
            onStatusChange={handleStatusChange}
            savingStatusIds={savingStatusIds}
            statusErrorIds={statusErrorIds}
          />
        </div>
      </div>

      {selectedLead && (
        <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} onUpdated={loadLeads} />
      )}
    </div>
  );
}
