import type { Lead } from "../../types/lead";
import { Table, type TableColumn } from "../ui/Table";
import { StatusBadge, TierBadge, ScorePill } from "../ui/Badge";
import { LoadingState, ErrorState } from "../ui/States";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { StatusSelect } from "../ui/StatusSelect";

interface LeadTableProps {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  onViewLead?: (lead: Lead) => void;
  onStatusChange?: (lead: Lead, status: Lead["status"]) => void;
  savingStatusIds?: Set<string>;
  statusErrorIds?: Set<string>;
}

function formatRevenue(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function formatEmployees(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString();
}

function DataQualityIndicator({ fields, isDuplicate, reason }: {
  fields: string[];
  isDuplicate: boolean;
  reason: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      {fields.length > 0 && (
        <span
          title={`Missing: ${fields.join(", ")}`}
          className="inline-flex items-center gap-1 rounded-full bg-status-warningDim border border-status-warning/30 px-1.5 py-0.5 text-[10px] font-semibold text-status-warning"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {fields.length}
        </span>
      )}
      {isDuplicate && (
        <span
          title={reason ?? "Possible duplicate"}
          className="inline-flex items-center gap-1 rounded-full bg-status-errorDim border border-status-error/30 px-1.5 py-0.5 text-[10px] font-semibold text-status-error"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Dup
        </span>
      )}
      {fields.length === 0 && !isDuplicate && (
        <span className="text-text-muted text-xs">—</span>
      )}
    </div>
  );
}

export function LeadTable({
  leads,
  loading,
  error,
  totalCount,
  onViewLead,
  onStatusChange,
  savingStatusIds,
  statusErrorIds,
}: LeadTableProps) {

  const columns: TableColumn<Lead>[] = [
    {
      key: "companyName",
      header: "Company",
      className: "min-w-[180px] w-[22%]",
      render: (r) => (
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-text-primary truncate" title={r.companyName}>
            {r.companyName}
          </span>
          {r.website && (
            <a
              href={r.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:text-accent-hover hover:underline truncate mt-0.5"
              title={r.website}
              onClick={(e) => e.stopPropagation()}
            >
              {r.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      ),
    },
    {
      key: "industry",
      header: "Industry",
      className: "min-w-[120px] w-[14%]",
      render: (r) => (
        <span className="text-text-secondary truncate block" title={r.industry ?? undefined}>
          {r.industry ?? "—"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      className: "min-w-[110px] w-[13%]",
      render: (r) => (
        <span className="text-text-secondary truncate block" title={r.location ?? undefined}>
          {r.location ?? "—"}
        </span>
      ),
    },
    {
      key: "estimatedRevenue",
      header: "Revenue",
      className: "min-w-[90px] w-[9%]",
      render: (r) => <span className="tabular-nums text-text-secondary whitespace-nowrap">{formatRevenue(r.estimatedRevenue)}</span>,
    },
    {
      key: "employeeCount",
      header: "Employees",
      className: "min-w-[90px] w-[9%]",
      render: (r) => <span className="tabular-nums text-text-secondary whitespace-nowrap">{formatEmployees(r.employeeCount)}</span>,
    },
    {
      key: "leadScore",
      header: "Score",
      className: "min-w-[120px] w-[12%]",
      render: (r) => (
        <div className="flex items-center gap-2">
          <ScorePill score={r.leadScore} />
          <TierBadge tier={r.scoreTier} />
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "min-w-[130px] w-[13%]",
      render: (r) => {
        if (onStatusChange) {
          const isSaving = savingStatusIds?.has(r.id) ?? false;
          const hasError = statusErrorIds?.has(r.id) ?? false;
          return (
            <div className="flex flex-col gap-1">
              <StatusSelect
                value={r.status}
                onChange={(status) => onStatusChange(r, status)}
                saving={isSaving}
                ariaLabel={`Change status for ${r.companyName}`}
              />
              {hasError && <span className="text-[10px] text-status-error">Failed to save</span>}
            </div>
          );
        }
        return <StatusBadge status={r.status} />;
      },
    },
    {
      key: "dataQuality",
      header: "Quality",
      className: "min-w-[80px] w-[8%]",
      render: (r) => (
        <DataQualityIndicator
          fields={r.missingFields}
          isDuplicate={r.isDuplicate}
          reason={r.duplicateReason}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[72px]",
      render: (r) =>
        onViewLead ? (
          <button
            type="button"
            onClick={() => onViewLead(r)}
            className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary hover:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent transition-colors whitespace-nowrap"
            aria-label={`View details for ${r.companyName}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
        ) : null,
    },
  ];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-surface-card border border-surface-border rounded-xl">
        <svg className="w-10 h-10 mb-3 text-surface-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.25">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <p className="text-sm font-medium text-text-secondary">No leads match your filters</p>
        <p className="text-xs text-text-muted mt-1">
          {totalCount > 0
            ? `${totalCount} lead${totalCount === 1 ? "" : "s"} exist — try clearing filters.`
            : "No leads available."}
        </p>
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      data={leads}
      rowKey={(r) => r.id}
      expandedRowRender={(r) => <ScoreBreakdown lead={r} />}
    />
  );
}
