import { useCallback, useEffect, useMemo, useState } from "react";
import { LeadDetailPanel } from "../components/leads/LeadDetailPanel";
import { fetchLeads } from "../services/api";
import type { Lead, TargetCriteria } from "../types/lead";
import { StatusBadge, TierBadge, ScorePill } from "../components/ui/Badge";
import { LoadingState, ErrorState } from "../components/ui/States";

interface DuplicatesPageProps { criteria: TargetCriteria; }

interface DuplicateGroup {
  groupKey: string;
  reason: string;
  leads: Lead[];
}

function groupDuplicates(leads: Lead[]): DuplicateGroup[] {
  const dupes = leads.filter((l) => l.isDuplicate && l.duplicateGroupKey);
  const groups = new Map<string, DuplicateGroup>();
  for (const lead of dupes) {
    const key = lead.duplicateGroupKey!;
    if (!groups.has(key)) groups.set(key, { groupKey: key, reason: lead.duplicateReason ?? "Unknown", leads: [] });
    groups.get(key)!.leads.push(lead);
  }
  return Array.from(groups.values()).filter((g) => g.leads.length > 1);
}

function formatRevenue(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function MatchTypeBadge({ reason }: { reason: string }) {
  const isDomain = reason.toLowerCase().includes("domain");
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${isDomain ? "bg-status-infoDim text-status-info border-status-info/30" : "bg-status-errorDim text-status-error border-status-error/30"}`}>
      {isDomain ? "Domain match" : "Name match"}
    </span>
  );
}

export function DuplicatesPage({ criteria }: DuplicatesPageProps) {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  const groups = useMemo(() => groupDuplicates(allLeads), [allLeads]);
  const totalDupes = useMemo(() => groups.reduce((s, g) => s + g.leads.length, 0), [groups]);

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  const selectedLead = useMemo(() => allLeads.find((l) => l.id === selectedLeadId) ?? null, [allLeads, selectedLeadId]);

  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (error)   return <div className="p-6"><ErrorState message={error} /></div>;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Potential Duplicates</h1>
        <p className="text-sm text-text-secondary mt-1">
          Leads flagged by domain or normalised company name matching. No records are deleted automatically.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Duplicate Groups", value: groups.length,                    cls: "text-text-primary" },
          { label: "Affected Leads",   value: totalDupes,                        cls: "text-status-error" },
          { label: "Clean Leads",      value: allLeads.length - totalDupes,      cls: "text-status-success" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Warning */}
      <div className="bg-status-warningDim border border-status-warning/30 rounded-xl p-4 flex gap-3">
        <svg className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-text-secondary">
          <strong className="text-status-warning">Review only.</strong> Duplicates are detected algorithmically and may require manual verification before taking action.
        </p>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-card border border-surface-border rounded-xl">
          <div className="w-12 h-12 mb-4 rounded-full bg-status-successDim flex items-center justify-center">
            <svg className="w-6 h-6 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-text-primary">No duplicates detected</p>
          <p className="text-xs text-text-muted mt-1">All leads appear to be unique.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isExpanded = expandedGroups.has(group.groupKey);
            return (
              <div key={group.groupKey} className="bg-surface-card border border-status-error/20 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupKey)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MatchTypeBadge reason={group.reason} />
                    <span className="text-sm font-semibold text-text-primary">{group.leads.length} leads</span>
                    <span className="text-xs text-text-muted hidden sm:block truncate max-w-xs">{group.reason}</span>
                  </div>
                  <svg className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-surface-border">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-surface-elevated">
                          {["Company", "Industry", "Revenue", "Score", "Status", ""].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-text-muted">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {group.leads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-surface-hover transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="text-sm font-semibold text-text-primary">{lead.companyName}</span>
                              {lead.website && <p className="text-xs text-accent">{lead.website.replace(/^https?:\/\//, "")}</p>}
                            </td>
                            <td className="px-4 py-2.5 text-sm text-text-secondary">{lead.industry ?? "—"}</td>
                            <td className="px-4 py-2.5 text-sm text-text-secondary tabular-nums">{formatRevenue(lead.estimatedRevenue)}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <ScorePill score={lead.leadScore} />
                                <TierBadge tier={lead.scoreTier} />
                              </div>
                            </td>
                            <td className="px-4 py-2.5"><StatusBadge status={lead.status} /></td>
                            <td className="px-4 py-2.5">
                              <button type="button" onClick={() => setSelectedLeadId(lead.id)}
                                className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedLead && (
        <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} onUpdated={loadLeads} />
      )}
    </div>
  );
}
