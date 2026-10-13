import type { LeadStatus, ScoreTier } from "../../types/lead";

const statusStyles: Record<LeadStatus, string> = {
  New:           "bg-surface-elevated text-text-secondary border border-surface-border",
  Contacted:     "bg-status-infoDim   text-status-info    border border-status-info/30",
  Qualified:     "bg-accent-dim       text-accent         border border-accent/30",
  Proposal:      "bg-status-warningDim text-status-warning border border-status-warning/30",
  "Closed Won":  "bg-status-successDim text-status-success border border-status-success/30",
  "Closed Lost": "bg-status-errorDim   text-status-error   border border-status-error/30",
};

const tierStyles: Record<ScoreTier, string> = {
  A:       "bg-status-successDim text-status-success border-status-success/40",
  B:       "bg-accent-dim        text-accent         border-accent/40",
  C:       "bg-status-warningDim text-status-warning border-status-warning/40",
  D:       "bg-surface-elevated  text-text-muted     border-surface-border",
  Unrated: "bg-surface-elevated  text-text-muted     border-surface-border",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

export function TierBadge({ tier }: { tier: ScoreTier }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${tierStyles[tier]}`}>
      {tier}
    </span>
  );
}

/** Score pill — shows numeric score with colour-coded background */
export function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 80 ? "bg-status-successDim text-status-success border border-status-success/30" :
    score >= 60 ? "bg-accent-dim text-accent border border-accent/30" :
    score >= 40 ? "bg-status-warningDim text-status-warning border border-status-warning/30" :
                  "bg-surface-elevated text-text-muted border border-surface-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-xs tabular-nums ${cls}`}>
      {score}
    </span>
  );
}
