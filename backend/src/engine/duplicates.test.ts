import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractDomain,
  normalizeCompanyName,
  getDuplicateKey,
  detectDuplicates,
  getMissingFields,
} from "./duplicates.js";
import type { Lead } from "../types/lead.js";

function makeLead(partial: Partial<Lead> & { id: string; companyName: string }): Lead {
  return {
    website: null,
    industry: null,
    location: null,
    estimatedRevenue: null,
    employeeCount: null,
    description: null,
    leadScore: 0,
    scoreTier: "Unrated",
    scoreReasons: [],
    status: "New",
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("extractDomain", () => {
  it("extracts domain from https URL", () => {
    assert.equal(extractDomain("https://nimbuscloud.example.com"), "nimbuscloud.example.com");
  });

  it("strips www prefix", () => {
    assert.equal(extractDomain("https://www.example.com"), "example.com");
  });

  it("returns null for null input", () => {
    assert.equal(extractDomain(null), null);
  });

  it("handles URLs with paths", () => {
    assert.equal(extractDomain("https://example.com/path/to/page"), "example.com");
  });
});

describe("normalizeCompanyName", () => {
  it("lowercases and removes punctuation", () => {
    assert.equal(normalizeCompanyName("NimbusCloud, Systems!"), "nimbuscloud systems");
  });

  it("removes common corporate suffixes", () => {
    assert.equal(normalizeCompanyName("Acme Corp Inc"), "acme");
    assert.equal(normalizeCompanyName("Global Tech LLC"), "global");
  });

  it("collapses whitespace", () => {
    assert.equal(normalizeCompanyName("Foo   Bar   Co"), "foo bar");
  });
});

describe("getDuplicateKey", () => {
  it("prefers domain over company name", () => {
    const lead = makeLead({
      id: "1",
      companyName: "Acme Inc",
      website: "https://acme.example.com",
    });
    assert.equal(getDuplicateKey(lead), "domain:acme.example.com");
  });

  it("falls back to normalized company name when no website", () => {
    const lead = makeLead({ id: "1", companyName: "Acme Inc" });
    assert.equal(getDuplicateKey(lead), "name:acme");
  });
});

describe("detectDuplicates", () => {
  it("flags leads sharing the same domain", () => {
    const leads = [
      makeLead({ id: "1", companyName: "Alpha", website: "https://shared.example.com" }),
      makeLead({ id: "2", companyName: "Beta", website: "https://shared.example.com" }),
      makeLead({ id: "3", companyName: "Gamma", website: "https://unique.example.com" }),
    ];
    const result = detectDuplicates(leads);
    assert.equal(result.get("1")!.isDuplicate, true);
    assert.equal(result.get("2")!.isDuplicate, true);
    assert.equal(result.get("3")!.isDuplicate, false);
    assert.ok(result.get("1")!.duplicateReason!.includes("shared.example.com"));
  });

  it("flags leads with matching normalized company names when no domain", () => {
    const leads = [
      makeLead({ id: "1", companyName: "Acme Corp Inc" }),
      makeLead({ id: "2", companyName: "Acme Corporation" }),
      makeLead({ id: "3", companyName: "Totally Different" }),
    ];
    const result = detectDuplicates(leads);
    assert.equal(result.get("1")!.isDuplicate, true);
    assert.equal(result.get("2")!.isDuplicate, true);
    assert.equal(result.get("3")!.isDuplicate, false);
  });

  it("never returns a group for a single record", () => {
    const leads = [makeLead({ id: "1", companyName: "Solo", website: "https://solo.example.com" })];
    const result = detectDuplicates(leads);
    assert.equal(result.get("1")!.isDuplicate, false);
    assert.equal(result.get("1")!.duplicateGroupKey, null);
  });
});

describe("getMissingFields", () => {
  it("reports website and revenue as missing", () => {
    const lead = makeLead({
      id: "1",
      companyName: "Test",
      website: null,
      industry: "SaaS",
      location: "USA",
      estimatedRevenue: null,
      employeeCount: 10,
    });
    const missing = getMissingFields(lead);
    assert.ok(missing.includes("Website"));
    assert.ok(missing.includes("Estimated Revenue"));
    assert.ok(!missing.includes("Industry"));
  });

  it("returns empty list when all qualification fields present", () => {
    const lead = makeLead({
      id: "1",
      companyName: "Test",
      website: "https://test.example.com",
      industry: "SaaS",
      location: "USA",
      estimatedRevenue: 1_000_000,
      employeeCount: 10,
    });
    assert.deepEqual(getMissingFields(lead), []);
  });
});
