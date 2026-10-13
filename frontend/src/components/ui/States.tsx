/** Loading spinner with skeleton effect */
export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20 text-text-secondary">
      <svg className="animate-spin w-5 h-5 mr-3 text-accent" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm text-text-secondary">Loading…</span>
    </div>
  );
}

/** Loading skeleton rows */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-px">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 bg-surface-card animate-pulse">
          <div className="h-3 bg-surface-border rounded w-36" />
          <div className="h-3 bg-surface-border rounded w-20 ml-auto" />
          <div className="h-3 bg-surface-border rounded w-16" />
          <div className="h-3 bg-surface-border rounded w-12" />
          <div className="h-3 bg-surface-border rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message = "No data found" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
      <svg className="w-12 h-12 mb-4 text-surface-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-sm font-medium text-text-secondary">{message}</p>
      <p className="text-xs text-text-muted mt-1">Try adjusting your filters.</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 mb-4 rounded-full bg-status-errorDim flex items-center justify-center">
        <svg className="w-6 h-6 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-text-primary">Something went wrong</p>
      <p className="text-xs text-text-secondary mt-1 max-w-xs text-center">{message}</p>
    </div>
  );
}
