import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeCsvField, buildLeadsCsv, CSV_HEADERS } from "./csv.js";
import type { EnrichedLead } from "../types/lead.js";

function makeLead(overrides: Partial<EnrichedLead> = {}): EnrichedLead {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    companyName: "Acme Corp",
    website: "https://acme.example.com",
    industry: "SaaS",
    location: "USA",
    estimatedRevenue: 10_000_000,
    employeeCount: 100,
    description: "A company",
    leadScore: 75,
    scoreTier: "B",
    scoreReasons: ["Good revenue", "ICP match"],
    status: "New",
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    breakdown: [],
    missingFields: [],
    isDuplicate: false,
    duplicateReason: null,
    duplicateGroupKey: null,
    ...overrides,
  };
}

test("escapeCsvField returns empty string for null and undefined", () => {
  assert.equal(escapeCsvField(null), "");
  assert.equal(escapeCsvField(undefined), "");
});

test("escapeCsvField passes through plain values", () => {
  assert.equal(escapeCsvField("hello"), "hello");
  assert.equal(escapeCsvField(123), "123");
  assert.equal(escapeCsvField("B"), "B");
});

test("escapeCsvField wraps values containing commas in quotes", () => {
  assert.equal(escapeCsvField("Acme, Inc."), '"Acme, Inc."');
});

test("escapeCsvField wraps values containing double quotes and doubles them", () => {
  assert.equal(escapeCsvField('He said "hi"'), '"He said ""hi"""');
});

test("escapeCsvField wraps values containing newlines", () => {
  assert.equal(escapeCsvField("line1\nline2"), '"line1\nline2"');
  assert.equal(escapeCsvField("line1\r\nline2"), '"line1\r\nline2"');
});

test("CSV_HEADERS contains the expected columns", () => {
  assert.deepEqual(
    CSV_HEADERS,
    [
      "companyName",
      "website",
      "industry",
      "location",
      "estimatedRevenue",
      "employeeCount",
      "leadScore",
      "scoreTier",
      "scoringReasons",
      "status",
      "notes",
      "createdAt",
      "updatedAt",
    ],
  );
});

test("buildLeadsCsv produces header row and one data row per lead", () => {
  const lead = makeLead();
  const csv = buildLeadsCsv([lead]);
  const lines = csv.trimEnd().split("\r\n");
  assert.equal(lines.length, 2);
  assert.equal(lines[0], CSV_HEADERS.join(","));
  assert.ok(lines[1].startsWith("Acme Corp,"));
});

test("buildLeadsCsv escapes special characters in notes and reasons", () => {
  const lead = makeLead({
    companyName: 'Acme "Super" Corp, LLC',
    notes: "Line one\nLine two, with comma",
    scoreReasons: ["Revenue, above target", 'Tier "A" material'],
  });
  const csv = buildLeadsCsv([lead]);
  const lines = csv.trimEnd().split("\r\n");
  const dataRow = lines[1];
  assert.ok(dataRow.includes('"Acme ""Super"" Corp, LLC"'));
  assert.ok(dataRow.includes('"Line one\nLine two, with comma"'));
  assert.ok(dataRow.includes('"Revenue, above target; Tier ""A"" material"'));
});

test("buildLeadsCsv renders numeric and null fields correctly", () => {
  const lead = makeLead({
    estimatedRevenue: null,
    employeeCount: 50,
    notes: null,
  });
  const csv = buildLeadsCsv([lead]);
  const lines = csv.trimEnd().split("\r\n");
  const cells = lines[1].split(",");
  assert.equal(cells[4], "");
  assert.equal(cells[5], "50");
});

test("buildLeadsCsv returns only the header for an empty array", () => {
  const csv = buildLeadsCsv([]);
  assert.equal(csv, CSV_HEADERS.join(",") + "\r\n");
});
