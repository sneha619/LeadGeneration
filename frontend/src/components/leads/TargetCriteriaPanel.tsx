import { useState } from "react";
import type { TargetCriteria } from "../../types/lead";

interface TargetCriteriaPanelProps {
  criteria: TargetCriteria;
  onChange: (next: TargetCriteria) => void;
  onReset: () => void;
  alwaysOpen?: boolean;
}

const inputCls =
  "w-full rounded-lg border border-surface-border bg-surface-elevated text-text-primary text-sm px-3 py-1.5 placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";
const labelCls = "block text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-1";

export function TargetCriteriaPanel({ criteria, onChange, onReset, alwaysOpen = false }: TargetCriteriaPanelProps) {
  const [open, setOpen] = useState(alwaysOpen);

  const update = (patch: Partial<TargetCriteria>) => onChange({ ...criteria, ...patch });

  const updateList = (key: "preferredIndustries" | "preferredLocations", value: string) => {
    const list = value.split(",").map((v) => v.trim()).filter((v) => v.length > 0);
    update({ [key]: list } as Partial<TargetCriteria>);
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      {!alwaysOpen && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-hover transition-colors"
        >
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Target Criteria & Scoring Weights</h3>
            <p className="text-xs text-text-muted mt-0.5">Define your ideal customer profile. Scores recalculate automatically.</p>
          </div>
          <svg
            className={`w-5 h-5 text-text-muted transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {open && (
        <div className={`px-5 pb-5 space-y-5 ${!alwaysOpen ? "border-t border-surface-border pt-5" : "pt-0"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Revenue */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                Revenue Fit <span className="text-accent ml-1">30%</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Min ($)</label>
                  <input
                    type="number" min={0}
                    value={criteria.targetMinRevenue ?? ""}
                    onChange={(e) => update({ targetMinRevenue: e.target.value === "" ? null : Number(e.target.value) })}
                    placeholder="10000000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max ($)</label>
                  <input
                    type="number" min={0}
                    value={criteria.targetMaxRevenue ?? ""}
                    onChange={(e) => update({ targetMaxRevenue: e.target.value === "" ? null : Number(e.target.value) })}
                    placeholder="100000000"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Employees */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                Employees <span className="text-accent ml-1">20%</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Min</label>
                  <input
                    type="number" min={0}
                    value={criteria.targetMinEmployees ?? ""}
                    onChange={(e) => update({ targetMinEmployees: e.target.value === "" ? null : Number(e.target.value) })}
                    placeholder="50"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max</label>
                  <input
                    type="number" min={0}
                    value={criteria.targetMaxEmployees ?? ""}
                    onChange={(e) => update({ targetMaxEmployees: e.target.value === "" ? null : Number(e.target.value) })}
                    placeholder="500"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Industries */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-1">
                Industries <span className="text-accent ml-1">25%</span>
              </h4>
              <input
                type="text"
                value={criteria.preferredIndustries.join(", ")}
                onChange={(e) => updateList("preferredIndustries", e.target.value)}
                placeholder="SaaS, FinTech, Cybersecurity"
                className={inputCls}
              />
              <p className="text-[11px] text-text-muted mt-1">Comma-separated. Exact match.</p>
            </div>

            {/* Locations */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-1">
                Locations <span className="text-accent ml-1">15%</span>
              </h4>
              <input
                type="text"
                value={criteria.preferredLocations.join(", ")}
                onChange={(e) => updateList("preferredLocations", e.target.value)}
                placeholder="USA, Canada, UK"
                className={inputCls}
              />
              <p className="text-[11px] text-text-muted mt-1">Comma-separated. Substring match.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surface-border">
            <p className="text-[11px] text-text-muted">Data completeness contributes the remaining 10%.</p>
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-surface-border hover:bg-surface-hover transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
