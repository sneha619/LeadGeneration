interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, delta, deltaType = "neutral", icon }: MetricCardProps) {
  const deltaColor =
    deltaType === "positive" ? "text-status-success" :
    deltaType === "negative" ? "text-status-error" :
    "text-text-muted";

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col gap-2 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{label}</span>
        {icon && (
          <span className="text-text-muted opacity-60">{icon}</span>
        )}
      </div>
      <div className="text-3xl font-bold text-text-primary tabular-nums leading-none">{value}</div>
      {delta && (
        <div className={`text-xs font-medium ${deltaColor}`}>{delta}</div>
      )}
    </div>
  );
}
