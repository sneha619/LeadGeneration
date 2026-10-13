import type { Lead } from "../../types/lead";
import { TierBadge, ScorePill } from "../ui/Badge";

export function ScoreBreakdown({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h4 className="text-sm font-semibold text-text-primary">Score Breakdown</h4>
        <ScorePill score={lead.leadScore} />
        <TierBadge tier={lead.scoreTier} />
      </div>

      {/* Breakdown table */}
      <div className="overflow-x-auto rounded-lg border border-surface-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-surface-elevated border-b border-surface-border">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-text-muted">Criterion</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-widest text-text-muted">Score</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-widest text-text-muted">Weight</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-widest text-text-muted">Points</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-text-muted">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {lead.breakdown.map((item) => (
              <tr key={item.criterion} className="hover:bg-surface-hover transition-colors">
                <td className="px-3 py-2 font-medium text-text-primary">{item.criterion}</td>
                <td className="px-3 py-2 text-right tabular-nums text-text-secondary">{item.score}</td>
                <td className="px-3 py-2 text-right tabular-nums text-text-muted">{Math.round(item.weight * 100)}%</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-text-primary">{item.contribution}</td>
                <td className="px-3 py-2 text-text-muted text-xs">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warnings */}
      {(lead.isDuplicate || lead.missingFields.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lead.isDuplicate && (
            <div className="rounded-lg bg-status-errorDim border border-status-error/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3.5 h-3.5 text-status-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-xs font-semibold text-status-error">Possible Duplicate</p>
              </div>
              <p className="text-xs text-text-secondary">{lead.duplicateReason}</p>
            </div>
          )}
          {lead.missingFields.length > 0 && (
            <div className="rounded-lg bg-status-warningDim border border-status-warning/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3.5 h-3.5 text-status-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs font-semibold text-status-warning">Missing Fields</p>
              </div>
              <p className="text-xs text-text-secondary">{lead.missingFields.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
