import { useState, Fragment, type ReactNode } from "react";

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  expandedRowRender?: (row: T) => ReactNode;
}

export function Table<T>({ columns, data, rowKey, expandedRowRender }: TableProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandable = Boolean(expandedRowRender);

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface-card">
      <table className="min-w-full">
        {/* Header */}
        <thead>
          <tr className="border-b border-surface-border bg-surface-tableHeader">
            {expandable && (
              <th className="w-10 px-3 py-3" />
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-text-muted whitespace-nowrap ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-surface-border">
          {data.map((row) => {
            const key = rowKey(row);
            const isExpanded = expandedKeys.has(key);
            return (
              <Fragment key={key}>
                <tr className="hover:bg-surface-hover transition-colors group">
                  {expandable && (
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(key)}
                        className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-surface-border transition-colors text-text-muted hover:text-text-secondary"
                        aria-label={isExpanded ? "Collapse row" : "Expand row"}
                      >
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-text-secondary ${col.className ?? ""}`}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
                {expandable && isExpanded && (
                  <tr className="bg-surface-base">
                    <td colSpan={columns.length + 1} className="px-4 py-4 border-b border-surface-border">
                      {expandedRowRender?.(row)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
