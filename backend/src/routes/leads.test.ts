import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../app.js";
import { initDbConnection, closeDb } from "../db/connection.js";
import { initDb } from "../db/schema.js";
import { seedLeads } from "../db/seed.js";
import type { Lead, EnrichedLead, TargetCriteria } from "../types/lead.js";

interface LeadsApiResponse {
  data: EnrichedLead[];
  count: number;
  total: number;
  facets: {
    industries: string[];
    locations: string[];
    statuses: string[];
  };
  criteria: TargetCriteria;
}

describe("API Routes & Validation", () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await initDbConnection();
    initDb();
    seedLeads();

    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    closeDb();
  });

  it("GET /api/health returns 200 with status ok", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string; service: string };
    assert.equal(body.status, "ok");
    assert.equal(body.service, "saasquatch-lead-intelligence");
  });

  it("GET /api/leads returns seeded leads with facets and default criteria", async () => {
    const res = await fetch(`${baseUrl}/api/leads`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as LeadsApiResponse;
    assert.equal(typeof body.count, "number");
    assert.equal(body.count, 30);
    assert.equal(body.total, 30);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.facets.industries.length > 0);
    assert.ok(body.facets.statuses.length > 0);
    assert.equal(body.criteria.targetMinRevenue, 10_000_000);
  });

  it("GET /api/leads flags duplicate records without automatic deletion", async () => {
    const res = await fetch(`${baseUrl}/api/leads`);
    const body = (await res.json()) as LeadsApiResponse;
    const duplicates = body.data.filter((l) => l.isDuplicate);
    assert.ok(duplicates.length >= 2, "Expected duplicate leads to be detected");

    const domainDup = duplicates.find((l) => l.duplicateGroupKey?.startsWith("domain:"));
    assert.ok(domainDup, "Expected domain-based duplicate group");
    assert.ok(domainDup?.duplicateReason?.includes("nimbuscloud.example.com"));

    // Verify all 30 records remain present (no automatic deletion)
    assert.equal(body.total, 30);
  });

  it("GET /api/leads filters by industry", async () => {
    const res = await fetch(`${baseUrl}/api/leads?industry=SaaS`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as LeadsApiResponse;
    assert.ok(body.count > 0);
    for (const lead of body.data) {
      assert.equal(lead.industry, "SaaS");
    }
  });

  it("GET /api/leads filters by search keyword", async () => {
    const res = await fetch(`${baseUrl}/api/leads?search=NimbusCloud`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as LeadsApiResponse;
    assert.ok(body.count >= 2);
    for (const lead of body.data) {
      assert.ok(
        lead.companyName.toLowerCase().includes("nimbuscloud") ||
        (lead.website?.toLowerCase().includes("nimbuscloud") ?? false),
      );
    }
  });

  it("GET /api/leads filters by revenue and score ranges", async () => {
    const res = await fetch(`${baseUrl}/api/leads?minRevenue=20000000&maxRevenue=60000000&minScore=70`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as LeadsApiResponse;
    for (const lead of body.data) {
      assert.ok(lead.estimatedRevenue !== null && lead.estimatedRevenue >= 20_000_000);
      assert.ok(lead.estimatedRevenue !== null && lead.estimatedRevenue <= 60_000_000);
      assert.ok(lead.leadScore >= 70);
    }
  });

  it("GET /api/leads returns 400 when invalid query parameters are supplied", async () => {
    const res = await fetch(`${baseUrl}/api/leads?minRevenue=-500`);
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.ok(body.error.includes("Invalid query parameters"));
  });

  it("GET /api/leads returns 400 when invalid sort field is supplied", async () => {
    const res = await fetch(`${baseUrl}/api/leads?sortBy=notAField`);
    assert.equal(res.status, 400);
  });

  it("GET /api/leads/:id returns lead details by ID", async () => {
    const listRes = await fetch(`${baseUrl}/api/leads`);
    const listBody = (await listRes.json()) as LeadsApiResponse;
    const firstLead = listBody.data[0];

    const detailRes = await fetch(`${baseUrl}/api/leads/${firstLead.id}`);
    assert.equal(detailRes.status, 200);
    const detailBody = (await detailRes.json()) as { data: EnrichedLead };
    assert.equal(detailBody.data.id, firstLead.id);
    assert.ok(detailBody.data.breakdown.length > 0);
  });

  it("GET /api/leads/:id returns 404 for unknown lead", async () => {
    const res = await fetch(`${baseUrl}/api/leads/00000000-0000-0000-0000-000000000999`);
    assert.equal(res.status, 404);
  });

  it("PATCH /api/leads/:id/status updates status and persists change", async () => {
    const listRes = await fetch(`${baseUrl}/api/leads`);
    const listBody = (await listRes.json()) as LeadsApiResponse;
    const targetLead = listBody.data[0];

    const newStatus = targetLead.status === "Qualified" ? "Contacted" : "Qualified";

    const updateRes = await fetch(`${baseUrl}/api/leads/${targetLead.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    assert.equal(updateRes.status, 200);
    const updateBody = (await updateRes.json()) as { data: EnrichedLead };
    assert.equal(updateBody.data.status, newStatus);

    // Verify persistence by fetching again
    const verifyRes = await fetch(`${baseUrl}/api/leads/${targetLead.id}`);
    const verifyBody = (await verifyRes.json()) as { data: EnrichedLead };
    assert.equal(verifyBody.data.status, newStatus);
  });

  it("PATCH /api/leads/:id/status rejects invalid status with 400", async () => {
    const listRes = await fetch(`${baseUrl}/api/leads`);
    const listBody = (await listRes.json()) as LeadsApiResponse;
    const targetLead = listBody.data[0];

    const res = await fetch(`${baseUrl}/api/leads/${targetLead.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PendingEvaluation" }),
    });
    assert.equal(res.status, 400);
  });

  it("PATCH /api/leads/:id/notes updates notes and persists change", async () => {
    const listRes = await fetch(`${baseUrl}/api/leads`);
    const listBody = (await listRes.json()) as LeadsApiResponse;
    const targetLead = listBody.data[0];

    const updatedNote = `Updated during automated test at ${Date.now()}`;

    const updateRes = await fetch(`${baseUrl}/api/leads/${targetLead.id}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: updatedNote }),
    });
    assert.equal(updateRes.status, 200);

    // Verify persistence
    const verifyRes = await fetch(`${baseUrl}/api/leads/${targetLead.id}`);
    const verifyBody = (await verifyRes.json()) as { data: EnrichedLead };
    assert.equal(verifyBody.data.notes, updatedNote);
  });

  it("GET /api/leads/export returns valid CSV content respecting filters", async () => {
    const res = await fetch(`${baseUrl}/api/leads/export?industry=SaaS`);
    assert.equal(res.status, 200);
    const contentType = res.headers.get("content-type");
    assert.ok(contentType?.includes("text/csv"));
    const disposition = res.headers.get("content-disposition");
    assert.ok(disposition?.includes("attachment"));

    const csvText = await res.text();
    const lines = csvText.trim().split("\r\n");
    assert.ok(lines.length >= 2, "CSV should contain header and at least one row");
    assert.ok(lines[0].startsWith("companyName,website"));
  });

  it("GET /api/leads/export returns 204 when no leads match active filters", async () => {
    const res = await fetch(`${baseUrl}/api/leads/export?industry=NonExistentIndustry123`);
    assert.equal(res.status, 204);
  });
});
