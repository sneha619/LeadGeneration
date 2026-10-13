import { useCallback, useEffect, useMemo, useState } from "react";
import { LeadTable } from "../components/leads/LeadTable";
import { LeadDetailPanel } from "../components/leads/LeadDetailPanel";
import { fetchLeads, updateLeadStatus } from "../services/api";
import type { Lead, LeadStatus, TargetCriteria } from "../types/lead";
import { TierBadge, ScorePill } from "../components/ui/Badge";

interface PrioritizedLeadsPageProps { criteria: TargetCriteria; }

export function PrioritizedLeadsPage({ criteria }: PrioritizedLeadsPageProps) {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [savingStatusIds, setSavingStatusIds] = useState<Set<string>>(new Set());
  const [statusErrorIds, setStatusErrorIds] = useState<Set<string>>(new Set());
  const [minScore, setMinScore] = useState(60);

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

  const filtered = useMemo(() =>
    allLeads.filter((l) => l.leadScore >= minScore).sort((a, b) => b.leadScore - a.leadScore),
    [allLeads, minScore]
  );

  const handleStatusChange = useCallback(async (lead: Lead, newStatus: LeadStatus) => {
    setSavingStatusIds((p) => new Set(p).add(lead.id));
    setStatusErrorIds((p) => { const n = new Set(p); n.delete(lead.id); return n; });
    try {
      await updateLeadStatus(lead.id, newStatus);
      setAllLeads((p) => p.map((l) => l.id === lead.id ? { ...l, status: newStatus } : l));
    } catch { setStatusErrorIds((p) => new Set(p).add(lead.id)); }
    finally { setSavingStatusIds((p) => { const n = new Set(p); n.delete(lead.id); return n; }); }
  }, []);

  const selectedLead = useMemo(() => filtered.find((l) => l.id === selectedLeadId) ?? null, [filtered, selectedLeadId]);

  const tierCounts = useMemo(() => ({
    A: allLeads.filter((l) => l.scoreTier === "A").length,
    B: allLeads.filter((l) => l.scoreTier === "B").length,
    C: allLeads.filter((l) => l.scoreTier === "C").length,
  }), [allLeads]);

  const tierCards = [
    { tier: "A", count: tierCounts.A, label: "Tier A · 80–100", cls: "border-status-success/40 text-status-success", bg: "bg-status-successDim" },
    { tier: "B", count: tierCounts.B, label: "Tier B · 60–79",  cls: "border-accent/40 text-accent",             bg: "bg-accent-dim" },
    { tier: "C", count: tierCounts.C, label: "Tier C · 40–59",  cls: "border-status-warning/40 text-status-warning", bg: "bg-status-warningDim" },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Prioritized Leads</h1>
          <p className="text-sm text-text-secondary mt-1">
            Ranked by fit score against your ICP. Expand any row for the full score breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="text-xs font-medium text-text-muted">Min Score:</label>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded-lg border border-surface-border bg-surface-elevated text-text-primary text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value={80}>80+ (Tier A)</option>
            <option value={60}>60+ (Tier A & B)</option>
            <option value={40}>40+ (Tier A–C)</option>
            <option value={0}>All leads</option>
          </select>
        </div>
      </div>

      {/* Tier summary */}
      <div className="grid grid-cols-3 gap-3">
        {tierCards.map((t) => (
          <div key={t.tier} className={`${t.bg} border ${t.cls} rounded-xl p-4`}>
            <p className="text-xs font-semibold text-text-muted">{t.label}</p>
            <p className={`text-3xl font-bold mt-1 ${t.cls.split(" ")[1]}`}>{t.count}</p>
            <p className="text-xs text-text-muted mt-0.5">leads</p>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-accent-dim border border-accent/30 rounded-xl p-4 flex gap-3">
        <svg className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-xs font-semibold text-accent">How scores are calculated</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Revenue fit (30%) + Industry match (25%) + Employee count (20%) + Location match (15%) + Data completeness (10%).
            Click the ▶ expand arrow on any row to see the full per-criterion breakdown.
          </p>
        </div>
      </div>

      {/* Top lead spotlight */}
      {!loading && filtered.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">Top Opportunity</p>
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-text-primary truncate">{filtered[0].companyName}</span>
                <TierBadge tier={filtered[0].scoreTier} />
              </div>
              <p className="text-sm text-text-secondary">{filtered[0].industry ?? "—"} · {filtered[0].location ?? "—"}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {filtered[0].scoreReasons.slice(0, 3).map((r, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-surface-elevated border border-surface-border px-2 py-0.5 text-[10px] text-text-secondary">{r}</span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <ScorePill score={filtered[0].leadScore} />
              <p className="text-[10px] text-text-muted mt-1">/ 100</p>
            </div>
          </div>
        </div>
      )}

      <LeadTable leads={filtered} loading={loading} error={error} totalCount={filtered.length}
        onViewLead={(l) => setSelectedLeadId(l.id)}
        onStatusChange={handleStatusChange}
        savingStatusIds={savingStatusIds}
        statusErrorIds={statusErrorIds}
      />

      {selectedLead && (
        <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} onUpdated={loadLeads} />
      )}
    </div>
  );
}
