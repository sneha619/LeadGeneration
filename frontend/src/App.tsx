import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { AllLeadsPage } from "./pages/AllLeadsPage";
import { PrioritizedLeadsPage } from "./pages/PrioritizedLeadsPage";
import { DuplicatesPage } from "./pages/DuplicatesPage";
import { PipelinePage } from "./pages/PipelinePage";
import { SettingsPage } from "./pages/SettingsPage";
import type { TargetCriteria } from "./types/lead";

export type NavPage =
  | "dashboard"
  | "leads"
  | "prioritized"
  | "duplicates"
  | "pipeline"
  | "settings";

const DEFAULT_CRITERIA: TargetCriteria = {
  targetMinRevenue: 10_000_000,
  targetMaxRevenue: 100_000_000,
  preferredIndustries: ["SaaS", "FinTech", "Data & Analytics", "Cybersecurity", "HealthTech"],
  targetMinEmployees: 50,
  targetMaxEmployees: 500,
  preferredLocations: ["USA", "United States", "Canada", "UK", "Germany"],
};

function App() {
  const [page, setPage] = useState<NavPage>("dashboard");
  const [criteria, setCriteria] = useState<TargetCriteria>(DEFAULT_CRITERIA);

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage criteria={criteria} setCriteria={setCriteria} navigate={setPage} />;
      case "leads":
        return <AllLeadsPage criteria={criteria} />;
      case "prioritized":
        return <PrioritizedLeadsPage criteria={criteria} />;
      case "duplicates":
        return <DuplicatesPage criteria={criteria} />;
      case "pipeline":
        return <PipelinePage criteria={criteria} />;
      case "settings":
        return (
          <SettingsPage
            criteria={criteria}
            onChange={setCriteria}
            onReset={() => setCriteria(DEFAULT_CRITERIA)}
          />
        );
      default:
        return <DashboardPage criteria={criteria} setCriteria={setCriteria} navigate={setPage} />;
    }
  };

  return (
    <AppShell activePage={page} onNavigate={setPage}>
      {renderPage()}
    </AppShell>
  );
}

export default App;
