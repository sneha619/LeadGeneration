import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardLayoutProps {
  title: string;
  activeNav?: string;
  children: ReactNode;
}

export function DashboardLayout({ title, activeNav = "Dashboard", children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar active={activeNav} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
