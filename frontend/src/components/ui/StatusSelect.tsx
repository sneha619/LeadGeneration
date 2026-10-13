import type { LeadStatus } from "../../types/lead";
import { LEAD_STATUSES } from "../../types/lead";

interface StatusSelectProps {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
  saving?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function StatusSelect({
  value,
  onChange,
  saving = false,
  disabled = false,
  ariaLabel = "Lead status",
  className = "",
}: StatusSelectProps) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
        disabled={disabled || saving}
        aria-label={ariaLabel}
        className={`rounded-md border border-surface-border bg-surface-elevated text-text-secondary text-xs px-2 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:border-accent/50 transition-colors ${className}`}
      >
        {LEAD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      {saving && (
        <svg
          className="animate-spin w-3.5 h-3.5 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
    </div>
  );
}
