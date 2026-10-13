import type { LeadsResponse, Lead, LeadQueryParams, LeadStatus } from "../types/lead";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

function buildQuery(params: LeadQueryParams): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchLeads(params: LeadQueryParams = {}): Promise<LeadsResponse> {
  const res = await fetch(`${API_BASE}/api/leads${buildQuery(params)}`);
  return parseJson<LeadsResponse>(res);
}

export async function getLead(id: string): Promise<Lead> {
  const res = await fetch(`${API_BASE}/api/leads/${encodeURIComponent(id)}`);
  const body = await parseJson<{ data: Lead }>(res);
  return body.data;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  const res = await fetch(`${API_BASE}/api/leads/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const body = await parseJson<{ data: Lead }>(res);
  return body.data;
}

export async function updateLeadNotes(id: string, notes: string | null): Promise<Lead> {
  const res = await fetch(`${API_BASE}/api/leads/${encodeURIComponent(id)}/notes`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
  const body = await parseJson<{ data: Lead }>(res);
  return body.data;
}

export async function exportLeadsCsv(params: LeadQueryParams = {}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/leads/export${buildQuery(params)}`);
  if (res.status === 204) {
    throw new Error("No leads to export for the current filters.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Export failed with status ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `saasquatch-leads-${new Date().toISOString().slice(0, 10)}.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
