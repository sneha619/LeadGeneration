import { useState, type ReactNode } from "react";
import type { NavPage } from "../../App";

interface AppShellProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: NavPage; label: string }[] = [
  { id: "dashboard",   label: "Dashboard"        },
  { id: "leads",       label: "All Leads"         },
  { id: "prioritized", label: "Prioritized Leads" },
  { id: "duplicates",  label: "Duplicates"        },
  { id: "pipeline",    label: "Pipeline"          },
  { id: "settings",    label: "Scoring Criteria"  },
];

/* ── Logo mark ─────────────────────────────────────────────────────────── */
function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

/* ── Hamburger icon ─────────────────────────────────────────────────────── */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      {open
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      }
    </svg>
  );
}

/* ── Main shell ─────────────────────────────────────────────────────────── */
export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: NavPage) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    /*
     * Body scrolls naturally — the root div just sets the background color and
     * min-height so the dark surface fills the viewport.
     * The sticky navbar uses `position: sticky; top: 0` on the body scroll
     * context, which works correctly when there is no overflow:hidden on any
     * ancestor. (We removed `height: 100%` from html/body/#root in index.css.)
     */
    <div className="bg-surface-base text-text-primary min-h-screen">
      {/* ── Sticky top navbar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-surface-nav border-b border-surface-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          {/* Three-zone flex row: [logo] [nav center] [actions] */}
          <div className="flex h-14 items-center gap-4">

            {/* Left: logo — never shrinks */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-dim">
                <LogoMark />
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="font-bold text-sm text-text-primary tracking-tight">SaaSquatch</span>
                <span className="text-text-muted text-[10px]">Lead Intelligence</span>
              </div>
            </div>

            {/* Center: desktop nav links — flex-1 + justify-center keeps links centered */}
            <nav
              className="hidden lg:flex items-center gap-0.5 flex-1 justify-center min-w-0"
              aria-label="Main navigation"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = item.id === activePage;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex-shrink-0 px-3.5 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive
                        ? "text-accent bg-accent-dim"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right: actions — ml-auto pushes to the right on all screen sizes */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {/* Synthetic dataset badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-status-warningDim border border-status-warning/30 rounded-full text-[10px] font-semibold text-status-warning">
                <span className="w-1.5 h-1.5 rounded-full bg-status-warning inline-block animate-pulse" />
                Synthetic
              </span>

              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                AE
              </div>

              {/* Mobile hamburger — only visible below lg breakpoint */}
              <button
                type="button"
                className="lg:hidden p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                <HamburgerIcon open={mobileOpen} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile dropdown nav ─────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="lg:hidden bg-surface-card border-t border-surface-border px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activePage;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main>
        <div className="max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
