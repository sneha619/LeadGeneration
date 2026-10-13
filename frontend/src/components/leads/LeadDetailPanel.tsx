import { useEffect, useRef, useState } from "react";
import type { Lead, LeadStatus } from "../../types/lead";
import { StatusBadge, TierBadge, ScorePill } from "../ui/Badge";
import { StatusSelect } from "../ui/StatusSelect";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { updateLeadStatus, updateLeadNotes } from "../../services/api";

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onUpdated: () => void;
}

function formatRevenue(value: number | null): string {
  if (value === null) return "Not provided";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-surface-border last:border-0">
      <dt className="text-xs font-medium text-text-muted flex-shrink-0">{label}</dt>
      <dd className="text-sm text-text-primary text-right break-words">{value}</dd>
    </div>
  );
}

export function LeadDetailPanel({ lead, onClose, onUpdated }: LeadDetailPanelProps) {
  const [status, setStatus]           = useState<LeadStatus>(lead.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError]  = useState<string | null>(null);

  const [notes, setNotes]         = useState(lead.notes ?? "");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError]  = useState<string | null>(null);
  const [notesSaved, setNotesSaved]  = useState(false);

  const originalNotes = lead.notes ?? "";
  const notesDirty = notes !== originalNotes;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStatus(lead.status);
    setNotes(lead.notes ?? "");
    setNotesSaved(false);
    setStatusError(null);
    setNotesError(null);
  }, [lead.id, lead.status, lead.notes]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (notesDirty) {
          if (window.confirm("You have unsaved notes. Discard and close?")) onClose();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [notesDirty, onClose]);

  useEffect(() => { dialogRef.current?.focus(); }, []);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setStatus(newStatus);
    setStatusSaving(true);
    setStatusError(null);
    try {
      await updateLeadStatus(lead.id, newStatus);
      onUpdated();
    } catch (err) {
      setStatus(lead.status);
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    setNotesError(null);
    setNotesSaved(false);
    try {
      await updateLeadNotes(lead.id, notes.trim() === "" ? null : notes);
      setNotesSaved(true);
      onUpdated();
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setNotesSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (notesDirty) {
        if (window.confirm("Discard unsaved notes and close?")) onClose();
      } else {
        onClose();
      }
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-detail-title"
    >
      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-surface-card border border-surface-border rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-surface-border flex-shrink-0">
          <div className="min-w-0">
            <h2 id="lead-detail-title" className="text-lg font-bold text-text-primary truncate">
              {lead.companyName}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <TierBadge tier={lead.scoreTier} />
              <ScorePill score={lead.leadScore} />
              <span className="text-xs text-text-muted">/ 100</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-hover transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Company info */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">Company Info</h3>
            <dl>
              <InfoRow label="Website" value={
                lead.website
                  ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover hover:underline">{lead.website.replace(/^https?:\/\//, "")}</a>
                  : <span className="text-text-muted">Not provided</span>
              } />
              <InfoRow label="Industry" value={lead.industry ?? <span className="text-text-muted">Not provided</span>} />
              <InfoRow label="Location" value={lead.location ?? <span className="text-text-muted">Not provided</span>} />
              <InfoRow label="Est. Revenue" value={formatRevenue(lead.estimatedRevenue)} />
              <InfoRow label="Employees" value={lead.employeeCount?.toLocaleString() ?? "Not provided"} />
              {lead.description && <InfoRow label="Description" value={lead.description} />}
            </dl>
          </section>

          {/* Score breakdown */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">Score Breakdown</h3>
            <ScoreBreakdown lead={lead} />
          </section>

          {/* Pipeline status */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">Pipeline Status</h3>
            <div className="flex items-center gap-3">
              <StatusSelect
                value={status}
                onChange={handleStatusChange}
                saving={statusSaving}
                ariaLabel="Change lead status"
                className="min-w-[140px]"
              />
              {statusSaving && <span className="text-xs text-text-muted">Saving…</span>}
              {statusError && <span className="text-xs text-status-error">{statusError}</span>}
              {!statusSaving && !statusError && <StatusBadge status={status} />}
            </div>
          </section>

          {/* Notes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Notes</h3>
              {notesSaved && <span className="text-xs text-status-success font-medium">✓ Saved</span>}
            </div>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); setNotesError(null); }}
              rows={5}
              placeholder="Add follow-up notes, context, or next steps…"
              className="w-full rounded-lg border border-surface-border bg-surface-elevated text-text-primary text-sm px-3 py-2.5 placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-y transition-colors"
              aria-label="Lead notes"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-text-muted">
                {notesDirty ? "Unsaved changes" : "No changes"}
              </span>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={notesSaving || !notesDirty}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-card transition-colors"
              >
                {notesSaving ? (
                  <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</>
                ) : "Save notes"}
              </button>
            </div>
            {notesError && <p className="text-xs text-status-error mt-1.5">{notesError}</p>}
          </section>

          {/* Timestamps */}
          <section className="border-t border-surface-border pt-4">
            <div className="flex gap-6 text-[11px] text-text-muted">
              <span>Created: {new Date(lead.createdAt).toLocaleString()}</span>
              <span>Updated: {new Date(lead.updatedAt).toLocaleString()}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
