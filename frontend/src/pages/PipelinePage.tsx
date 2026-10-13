import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchLeads, updateLeadStatus } from "../services/api";
import { LeadDetailPanel } from "../components/leads/LeadDetailPanel";
import type { Lead, LeadStatus, TargetCriteria } from "../types/lead";
import { LEAD_STATUSES } from "../types/lead";
import { StatusBadge, TierBadge, ScorePill } from "../components/ui/Badge";
import { StatusSelect } from "../components/ui/StatusSelect";
import { LoadingState, ErrorState } from "../components/ui/States";

interface PipelinePageProps { criteria: TargetCriteria; }

/* Status accent colors for dark theme */
const STATUS_ACCENT: Record<LeadStatus, { border: string; bg: string; text: string }> = {
  "New":         { border: "border-l-surface-border",  bg: "bg-surface-elevated", text: "text-text-muted"    },
  "Contacted":   { border: "border-l-status-info",     bg: "bg-status-infoDim",   text: "text-status-info"   },
  "Qualified":   { border: "border-l-accent",          bg: "bg-accent-dim",       text: "text-accent"        },
  "Proposal":    { border: "border-l-status-warning",  bg: "bg-status-warningDim",text: "text-status-warning"},
  "Closed Won":  { border: "border-l-status-success",  bg: "bg-status-successDim",text: "text-status-success"},
  "Closed Lost": { border: "border-l-status-error",    bg: "bg-status-errorDim",  text: "text-status-error"  },
};

function formatRevenue(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

export function PipelinePage({ criteria }: PipelinePageProps) {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [savingStatusIds, setSavingStatusIds] = useState<Set<string>>(new Set());
  const [statusErrorIds, setStatusErrorIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"board" | "table">("table");

  const loadLeads = useCallback(() => {
    setLoading(true); setError(null);
    fetchLeads({
      targetMinRevenue: criteria.targetMinRevenue ?? undefined,
      targetMaxRevenue: criteria.targetMaxRevenue ?? undefined,
      preferredIndustries: criteria.preferredIndustries.join(","),
      targetMinEmployees: criteria.targetMinEmployees ?? undefined,
      targetMaxEmployees: criteria.targetMaxEmployees ?? undefined,
      preferredLocations: criteria.preferredLocations.join(","),
    })
      .then((res) => setAllLeads(res.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [criteria]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleStatusChange = useCallback(async (lead: Lead, newStatus: LeadStatus) => {
    setSavingStatusIds((p) => new Set(p).add(lead.id));
    setStatusErrorIds((p) => { const n = new Set(p); n.delete(lead.id); return n; });
    try {
      await updateLeadStatus(lead.id, newStatus);
      setAllLeads((p) => p.map((l) => l.id === lead.id ? { ...l, status: newStatus } : l));
    } catch { setStatusErrorIds((p) => new Set(p).add(lead.id)); }
    finally { setSavingStatusIds((p) => { const n = new Set(p); n.delete(lead.id); return n; }); }
  }, []);

  const filteredLeads = useMemo(() => {
    let leads = allLeads;
    if (statusFilter) leads = leads.filter((l) => l.status === statusFilter);
    if (searchQuery) { const q = searchQuery.toLowerCase(); leads = leads.filter((l) => l.companyName.toLowerCase().includes(q)); }
    return leads.sort((a, b) => b.leadScore - a.leadScore);
  }, [allLeads, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts = {} as Record<LeadStatus, number>;
    LEAD_STATUSES.forEach((s) => { counts[s] = allLeads.filter((l) => l.status === s).length; });
    return counts;
  }, [allLeads]);

  const selectedLead = useMemo(() => allLeads.find((l) => l.id === selectedLeadId) ?? null, [allLeads, selectedLeadId]);

  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (error)   return <div className="p-6"><ErrorState message={error} /></div>;

  const viewBtnCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
      active ? "bg-accent border-accent text-white" : "bg-surface-elevated border-surface-border text-text-secondary hover:bg-surface-hover hover:text-text-primary"
    }`;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pipeline</h1>
          <p className="text-sm text-text-secondary mt-1">Track lead status, manage follow-ups, and update pipeline stage.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setView("table")} className={viewBtnCls(view === "table")}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            Table
          </button>
          <button type="button" onClick={() => setView("board")} className={viewBtnCls(view === "board")}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>
            Board
          </button>
        </div>
      </div>

      {/* Status funnel chips */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        {LEAD_STATUSES.map((s) => {
          const a = STATUS_ACCENT[s];
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`text-left p-3 rounded-xl border-l-4 border border-surface-border transition-all ${a.border} ${a.bg} ${isActive ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-base" : "hover:opacity-90"}`}
            >
              <p className={`text-[10px] font-semibold truncate ${a.text}`}>{s}</p>
              <p className="text-2xl font-bold text-text-primary mt-0.5">{statusCounts[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company…"
            className="w-full rounded-lg border border-surface-border bg-surface-elevated text-text-primary text-sm pl-9 pr-3 py-1.5 placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <span className="text-xs text-text-muted">{filteredLeads.length} leads</span>
        {(statusFilter || searchQuery) && (
          <button type="button" onClick={() => { setStatusFilter(""); setSearchQuery(""); }}
            className="text-xs font-medium text-status-error hover:text-red-400 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Board view */}
      {view === "board" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LEAD_STATUSES.filter((s) => !statusFilter || s === statusFilter).map((status) => {
            const statusLeads = filteredLeads.filter((l) => l.status === status);
            const a = STATUS_ACCENT[status];
            return (
              <div key={status} className={`rounded-xl border border-surface-border border-t-2 ${a.border.replace("border-l-", "border-t-")} bg-surface-card overflow-hidden`}>
                <div className="px-3 py-2.5 border-b border-surface-border flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className={`text-xs font-bold ${a.text}`}>{statusLeads.length}</span>
                </div>
                <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto">
                  {statusLeads.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">No leads</p>
                  ) : (
                    statusLeads.map((lead) => (
                      <div key={lead.id}
                        className="bg-surface-elevated border border-surface-border rounded-lg p-2.5 hover:border-accent/40 hover:bg-surface-hover cursor-pointer transition-all"
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-text-primary line-clamp-1">{lead.companyName}</p>
                          <TierBadge tier={lead.scoreTier} />
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5">{lead.industry ?? "—"} · {formatRevenue(lead.estimatedRevenue)}</p>
                        {lead.notes && (
                          <p className="text-[10px] text-text-muted mt-1.5 line-clamp-2 border-t border-surface-border pt-1">{lead.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table view */
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface-card">
          <table className="min-w-full">
            <thead>
              <tr className="bg-surface-elevated border-b border-surface-border">
                {["Company", "Score", "Industry", "Revenue", "Status", "Notes", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredLeads.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-text-muted">No leads match the current filters.</td></tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSaving = savingStatusIds.has(lead.id);
                  const hasError = statusErrorIds.has(lead.id);
                  return (
                    <tr key={lead.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-text-primary">{lead.companyName}</p>
                        {lead.website && <p className="text-xs text-accent">{lead.website.replace(/^https?:\/\//, "")}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <ScorePill score={lead.leadScore} />
                          <TierBadge tier={lead.scoreTier} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{lead.industry ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary tabular-nums">{formatRevenue(lead.estimatedRevenue)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusSelect value={lead.status} onChange={(s) => handleStatusChange(lead, s)} saving={isSaving} ariaLabel={`Status for ${lead.companyName}`} />
                          {hasError && <span className="text-[10px] text-status-error">Failed</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted max-w-[180px]">
                        {lead.notes
                          ? <span className="line-clamp-2">{lead.notes}</span>
                          : <span className="text-text-muted italic">No notes</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setSelectedLeadId(lead.id)}
                          className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedLead && (
        <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} onUpdated={loadLeads} />
      )}
    </div>
  );
}
