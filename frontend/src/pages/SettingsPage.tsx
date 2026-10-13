import type { TargetCriteria } from "../types/lead";
import { TargetCriteriaPanel } from "../components/leads/TargetCriteriaPanel";

interface SettingsPageProps {
  criteria: TargetCriteria;
  onChange: (next: TargetCriteria) => void;
  onReset: () => void;
}

function WeightBar({ label, pct, color = "bg-accent" }: { label: string; pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-40 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-surface-border/50 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-text-primary w-8 text-right">{pct}%</span>
    </div>
  );
}

const weights = [
  { label: "Revenue Fit",        pct: 30, color: "bg-accent" },
  { label: "Industry Match",     pct: 25, color: "bg-status-info" },
  { label: "Employee Count Fit", pct: 20, color: "bg-status-success" },
  { label: "Location Match",     pct: 15, color: "bg-status-warning" },
  { label: "Data Completeness",  pct: 10, color: "bg-text-muted" },
];

export function SettingsPage({ criteria, onChange, onReset }: SettingsPageProps) {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Scoring Criteria</h1>
        <p className="text-sm text-text-secondary mt-1">
          Configure your Ideal Customer Profile. Lead scores recalculate instantly when you update these settings.
        </p>
      </div>

      {/* Scoring model */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Scoring Model</h2>
          <p className="text-xs text-text-muted mt-0.5">Each lead is scored 0–100 based on ICP fit. Fixed weights below.</p>
        </div>
        <div className="space-y-3">
          {weights.map((w) => <WeightBar key={w.label} {...w} />)}
        </div>
        <div className="pt-3 border-t border-surface-border flex flex-wrap gap-3 text-[11px] text-text-muted">
          <span><span className="text-status-success font-semibold">Tier A</span> 80–100</span>
          <span><span className="text-accent font-semibold">Tier B</span> 60–79</span>
          <span><span className="text-status-warning font-semibold">Tier C</span> 40–59</span>
          <span><span className="text-text-muted font-semibold">Tier D</span> 0–39</span>
        </div>
      </div>

      {/* Current ICP summary */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary">Current ICP Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            {[
              { label: "Min Revenue", value: criteria.targetMinRevenue !== null ? `$${(criteria.targetMinRevenue / 1_000_000).toFixed(0)}M` : "Not set" },
              { label: "Max Revenue", value: criteria.targetMaxRevenue !== null ? `$${(criteria.targetMaxRevenue / 1_000_000).toFixed(0)}M` : "Not set" },
              { label: "Min Employees", value: criteria.targetMinEmployees?.toLocaleString() ?? "Not set" },
              { label: "Max Employees", value: criteria.targetMaxEmployees?.toLocaleString() ?? "Not set" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-1.5 border-b border-surface-border last:border-0">
                <span className="text-text-muted">{row.label}</span>
                <span className="font-semibold text-text-primary">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-text-muted mb-1.5">Preferred Industries</p>
              <div className="flex flex-wrap gap-1">
                {criteria.preferredIndustries.length > 0
                  ? criteria.preferredIndustries.map((i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-accent-dim border border-accent/30 text-accent px-2 py-0.5 text-[10px] font-medium">{i}</span>
                  ))
                  : <span className="text-text-muted">None</span>
                }
              </div>
            </div>
            <div>
              <p className="text-text-muted mb-1.5">Preferred Locations</p>
              <div className="flex flex-wrap gap-1">
                {criteria.preferredLocations.length > 0
                  ? criteria.preferredLocations.map((l) => (
                    <span key={l} className="inline-flex items-center rounded-full bg-surface-elevated border border-surface-border text-text-secondary px-2 py-0.5 text-[10px] font-medium">{l}</span>
                  ))
                  : <span className="text-text-muted">None</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Edit Criteria</h2>
        <TargetCriteriaPanel criteria={criteria} onChange={onChange} onReset={onReset} alwaysOpen />
      </div>

      {/* Note */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <p className="text-xs text-text-muted">
          <strong className="text-text-secondary">Session note:</strong> These criteria are passed as query parameters to the backend scoring engine per-request. They are not persisted between browser sessions. Backend scoring defaults can be changed in <code className="text-accent text-[11px]">backend/src/engine/scoring.ts</code>.
        </p>
      </div>
    </div>
  );
}
