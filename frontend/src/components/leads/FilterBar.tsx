import type { LeadsFacets } from "../../types/lead";

export interface FilterState {
  search: string;
  industry: string;
  location: string;
  minRevenue: string;
  maxRevenue: string;
  minEmployees: string;
  maxEmployees: string;
  minScore: string;
  maxScore: string;
  status: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}

export const emptyFilters: FilterState = {
  search: "",
  industry: "",
  location: "",
  minRevenue: "",
  maxRevenue: "",
  minEmployees: "",
  maxEmployees: "",
  minScore: "",
  maxScore: "",
  status: "",
  sortBy: "",
  sortDir: "desc",
};

interface FilterBarProps {
  filters: FilterState;
  facets: LeadsFacets;
  onChange: (next: FilterState) => void;
  onClear: () => void;
}

const sortOptions = [
  { value: "", label: "Default (Score)" },
  { value: "companyName", label: "Company Name" },
  { value: "estimatedRevenue", label: "Est. Revenue" },
  { value: "employeeCount", label: "Employee Count" },
  { value: "leadScore", label: "Lead Score" },
];

/* ── Shared class strings ─────────────────────────────────────────────── */
const inputCls =
  "w-full rounded-lg border border-surface-border bg-surface-elevated text-text-primary text-sm px-3 py-1.5 placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";
const labelCls = "block text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-1";

function DarkSelect({
  value,
  onChange,
  children,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

export function FilterBar({ filters, facets, onChange, onClear }: FilterBarProps) {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  /* Active filter chips */
  const chips: { label: string; key: keyof FilterState }[] = [];
  if (filters.search)    chips.push({ label: `"${filters.search}"`,           key: "search" });
  if (filters.industry)  chips.push({ label: filters.industry,               key: "industry" });
  if (filters.location)  chips.push({ label: filters.location,               key: "location" });
  if (filters.status)    chips.push({ label: filters.status,                 key: "status" });
  if (filters.minRevenue || filters.maxRevenue)
    chips.push({ label: `Rev ${filters.minRevenue || "0"}–${filters.maxRevenue || "∞"}`, key: "minRevenue" });
  if (filters.minEmployees || filters.maxEmployees)
    chips.push({ label: `Emp ${filters.minEmployees || "0"}–${filters.maxEmployees || "∞"}`, key: "minEmployees" });
  if (filters.minScore || filters.maxScore)
    chips.push({ label: `Score ${filters.minScore || "0"}–${filters.maxScore || "100"}`, key: "minScore" });

  const removeChip = (key: keyof FilterState) => {
    const patch: Partial<FilterState> = {};
    if (key === "minRevenue")   { patch.minRevenue = ""; patch.maxRevenue = ""; }
    else if (key === "minEmployees") { patch.minEmployees = ""; patch.maxEmployees = ""; }
    else if (key === "minScore") { patch.minScore = ""; patch.maxScore = ""; }
    else (patch as Record<string, string>)[key] = "";
    update(patch);
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-4">
      {/* Row 1: search + sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search company, website, or industry…"
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-44">
            <DarkSelect value={filters.sortBy} onChange={(v) => update({ sortBy: v })} placeholder="Sort by…">
              {sortOptions.filter((o) => o.value !== "").map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </DarkSelect>
          </div>
          <button
            type="button"
            onClick={() => update({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" })}
            title="Toggle sort direction"
            className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${filters.sortDir === "asc" ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {filters.sortDir === "asc" ? "Asc" : "Desc"}
          </button>
        </div>
      </div>

      {/* Row 2: facet selectors + range inputs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className={labelCls}>Industry</label>
          <DarkSelect value={filters.industry} onChange={(v) => update({ industry: v })} placeholder="All">
            {facets.industries.map((i) => <option key={i} value={i}>{i}</option>)}
          </DarkSelect>
        </div>
        <div>
          <label className={labelCls}>Location</label>
          <DarkSelect value={filters.location} onChange={(v) => update({ location: v })} placeholder="All">
            {facets.locations.map((l) => <option key={l} value={l}>{l}</option>)}
          </DarkSelect>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <DarkSelect value={filters.status} onChange={(v) => update({ status: v })} placeholder="All">
            {facets.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </DarkSelect>
        </div>
        <div>
          <label className={labelCls}>Min Revenue</label>
          <input type="number" min={0} value={filters.minRevenue} onChange={(e) => update({ minRevenue: e.target.value })} placeholder="e.g. 10M" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Max Revenue</label>
          <input type="number" min={0} value={filters.maxRevenue} onChange={(e) => update({ maxRevenue: e.target.value })} placeholder="e.g. 100M" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Min Employees</label>
          <input type="number" min={0} value={filters.minEmployees} onChange={(e) => update({ minEmployees: e.target.value })} placeholder="50" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Max Employees</label>
          <input type="number" min={0} value={filters.maxEmployees} onChange={(e) => update({ maxEmployees: e.target.value })} placeholder="500" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Min Score</label>
          <input type="number" min={0} max={100} value={filters.minScore} onChange={(e) => update({ minScore: e.target.value })} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Max Score</label>
          <input type="number" min={0} max={100} value={filters.maxScore} onChange={(e) => update({ maxScore: e.target.value })} placeholder="100" className={inputCls} />
        </div>
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Active:</span>
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-accent-dim border border-accent/30 text-accent px-2.5 py-0.5 text-xs font-medium"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => removeChip(chip.key)}
                className="hover:text-white ml-0.5"
                aria-label={`Remove ${chip.label} filter`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="ml-auto text-xs font-medium text-status-error hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
