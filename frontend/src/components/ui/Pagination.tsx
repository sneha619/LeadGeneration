interface PaginationProps {
  /** Total number of items across all pages */
  totalItems: number;
  /** How many items per page (controlled) */
  pageSize: number;
  /** Current page number, 1-indexed */
  currentPage: number;
  /** Available page-size options (default: 10, 25, 50) */
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/**
 * Client-side pagination footer.
 *
 * Shows:
 *   "Showing 1–10 of 28 leads"   |  [< Prev]  [1] [2] [3]  [Next >]   |  [10 ▾]
 *
 * - Renders nothing when totalItems === 0.
 * - Prev disabled on page 1, Next disabled on last page.
 * - Active page button highlighted in accent.
 * - Shows at most 7 page buttons (with ellipsis compression when there are many pages).
 */
export function Pagination({
  totalItems,
  pageSize,
  currentPage,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  /* ── Build visible page numbers (up to 7 slots with ellipsis) ─────────── */
  const pageNumbers = buildPageRange(currentPage, totalPages);

  const base =
    "inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  const pageBtn = `${base} text-text-secondary hover:bg-surface-hover hover:text-text-primary`;
  const activePage = `${base} bg-accent text-white cursor-default`;
  const disabledBtn = `${base} text-text-muted cursor-not-allowed opacity-40`;
  const dotStyle = `${base} text-text-muted cursor-default select-none`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 pt-3 border-t border-surface-border">
      {/* Left: showing X–Y of Z */}
      <p className="text-xs text-text-secondary tabular-nums flex-shrink-0">
        Showing <span className="font-semibold text-text-primary">{firstItem}</span>–
        <span className="font-semibold text-text-primary">{lastItem}</span> of{" "}
        <span className="font-semibold text-text-primary">{totalItems}</span> leads
      </p>

      {/* Center: page buttons */}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Prev */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={currentPage <= 1 ? disabledBtn : pageBtn}
          aria-label="Previous page"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p, i) =>
          p === "…" ? (
            <span key={`dot-${i}`} className={dotStyle}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              aria-current={p === currentPage ? "page" : undefined}
              className={p === currentPage ? activePage : pageBtn}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={currentPage >= totalPages ? disabledBtn : pageBtn}
          aria-label="Next page"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>

      {/* Right: page size selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <label htmlFor="page-size-select" className="text-xs text-text-secondary whitespace-nowrap">
          Rows per page
        </label>
        <select
          id="page-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 rounded-md border border-surface-border bg-surface-card px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ── Build page number array with ellipsis ─────────────────────────────── */
function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "…")[] = [];

  if (current <= 4) {
    // Start region: [1 2 3 4 5 … last]
    for (let i = 1; i <= Math.min(5, total); i++) pages.push(i);
    if (total > 6) pages.push("…");
    pages.push(total);
  } else if (current >= total - 3) {
    // End region: [1 … (last-4) … last]
    pages.push(1);
    pages.push("…");
    for (let i = Math.max(total - 4, 2); i <= total; i++) pages.push(i);
  } else {
    // Middle region: [1 … (c-1) c (c+1) … last]
    pages.push(1);
    pages.push("…");
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push("…");
    pages.push(total);
  }

  return pages;
}
