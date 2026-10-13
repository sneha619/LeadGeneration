import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  scoreLead,
  scoreCompleteness,
  tierFromScore,
  normalizeWeights,
  DEFAULT_WEIGHTS,
  NEUTRAL_SCORE,
  DEFAULT_TARGET_CRITERIA,
} from "./scoring.js";
import type { Lead, TargetCriteria } from "../types/lead.js";

const baseLead: Lead = {
  id: "00000000-0000-0000-0000-000000000001",
  companyName: "Test Co",
  website: "https://test.example.com",
  industry: "SaaS",
  location: "San Francisco, CA, USA",
  estimatedRevenue: 50_000_000,
  employeeCount: 200,
  description: "A test company",
  leadScore: 0,
  scoreTier: "Unrated",
  scoreReasons: [],
  status: "New",
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const criteria: TargetCriteria = {
  targetMinRevenue: 10_000_000,
  targetMaxRevenue: 100_000_000,
  preferredIndustries: ["SaaS", "FinTech"],
  targetMinEmployees: 50,
  targetMaxEmployees: 500,
  preferredLocations: ["USA", "Canada"],
};

describe("scoreCompleteness", () => {
  it("returns 100 when all fields present", () => {
    const result = scoreCompleteness(baseLead);
    assert.equal(result.score, 100);
    assert.deepEqual(result.missing, []);
  });

  it("returns proportional score when fields missing", () => {
    const lead = { ...baseLead, website: null, estimatedRevenue: null };
    const result = scoreCompleteness(lead);
    assert.equal(result.score, Math.round((4 / 6) * 100));
    assert.ok(result.missing.includes("Website"));
    assert.ok(result.missing.includes("Estimated Revenue"));
  });
});

describe("tierFromScore", () => {
  it("maps A for 80-100", () => {
    assert.equal(tierFromScore(80), "A");
    assert.equal(tierFromScore(100), "A");
    assert.equal(tierFromScore(95), "A");
  });

  it("maps B for 60-79", () => {
    assert.equal(tierFromScore(60), "B");
    assert.equal(tierFromScore(79), "B");
  });

  it("maps C for 40-59", () => {
    assert.equal(tierFromScore(40), "C");
    assert.equal(tierFromScore(59), "C");
  });

  it("maps D for 0-39", () => {
    assert.equal(tierFromScore(0), "D");
    assert.equal(tierFromScore(39), "D");
  });
});

describe("scoreLead", () => {
  it("produces a score between 0 and 100", () => {
    const result = scoreLead(baseLead, criteria);
    assert.ok(result.leadScore >= 0 && result.leadScore <= 100);
  });

  it("weights sum to 1.0", () => {
    const totalWeight =
      DEFAULT_WEIGHTS.revenue +
      DEFAULT_WEIGHTS.industry +
      DEFAULT_WEIGHTS.employees +
      DEFAULT_WEIGHTS.geographic +
      DEFAULT_WEIGHTS.completeness;
    assert.equal(Math.round(totalWeight * 100) / 100, 1);
  });

  it("breakdown contributions sum to the final score", () => {
    const result = scoreLead(baseLead, criteria);
    const sum = result.breakdown.reduce((acc, b) => acc + b.contribution, 0);
    assert.equal(Math.round(sum), result.leadScore);
  });

  it("each breakdown item has score 0-100 and correct contribution", () => {
    const result = scoreLead(baseLead, criteria);
    for (const item of result.breakdown) {
      assert.ok(item.score >= 0 && item.score <= 100);
      assert.equal(Math.round(item.score * item.weight * 100) / 100, item.contribution);
    }
  });

  it("a perfect-fit lead scores 100", () => {
    const perfectLead: Lead = {
      ...baseLead,
      estimatedRevenue: 50_000_000,
      industry: "SaaS",
      employeeCount: 200,
      location: "San Francisco, CA, USA",
    };
    const result = scoreLead(perfectLead, criteria);
    assert.equal(result.leadScore, 100);
    assert.equal(result.scoreTier, "A");
  });

  it("applies neutral score for missing revenue instead of 0", () => {
    const lead = { ...baseLead, estimatedRevenue: null };
    const result = scoreLead(lead, criteria);
    const revenueItem = result.breakdown.find((b) => b.criterion === "Revenue Fit");
    assert.equal(revenueItem?.score, NEUTRAL_SCORE);
  });

  it("applies neutral score for missing industry instead of treating as mismatch", () => {
    const lead = { ...baseLead, industry: null };
    const result = scoreLead(lead, criteria);
    const industryItem = result.breakdown.find((b) => b.criterion === "Industry Fit");
    assert.equal(industryItem?.score, NEUTRAL_SCORE);
  });

  it("non-preferred industry scores 0", () => {
    const lead = { ...baseLead, industry: "Manufacturing" };
    const result = scoreLead(lead, criteria);
    const industryItem = result.breakdown.find((b) => b.criterion === "Industry Fit");
    assert.equal(industryItem?.score, 0);
  });

  it("revenue below target min gets a partial linear score", () => {
    const lead = { ...baseLead, estimatedRevenue: 5_000_000 };
    const result = scoreLead(lead, criteria);
    const revenueItem = result.breakdown.find((b) => b.criterion === "Revenue Fit");
    assert.ok(revenueItem!.score > 0 && revenueItem!.score < 100);
    assert.equal(revenueItem!.score, 50);
  });

  it("uses default criteria when called with defaults", () => {
    const result = scoreLead(baseLead, DEFAULT_TARGET_CRITERIA);
    assert.ok(result.leadScore >= 0 && result.leadScore <= 100);
  });

  it("does not exceed 100 even with all criteria at 100", () => {
    const result = scoreLead(baseLead, criteria);
    assert.ok(result.leadScore <= 100);
  });

  it("handles non-normalized custom weights proportionally", () => {
    // Integer percentage weights summing to 100
    const rawWeights = { revenue: 50, industry: 50, employees: 0, geographic: 0, completeness: 0 };
    const result = scoreLead(baseLead, criteria, rawWeights);
    // baseLead has perfect revenue (100) and perfect industry (100)
    assert.equal(result.leadScore, 100);
    const rev = result.breakdown.find((b) => b.criterion === "Revenue Fit");
    assert.equal(rev?.weight, 0.5);
  });
});

describe("normalizeWeights", () => {
  it("leaves already normalized weights unchanged", () => {
    const norm = normalizeWeights(DEFAULT_WEIGHTS);
    assert.equal(Math.round(norm.revenue * 100) / 100, 0.3);
    assert.equal(Math.round(norm.industry * 100) / 100, 0.25);
    assert.equal(Math.round(norm.employees * 100) / 100, 0.2);
    assert.equal(Math.round(norm.geographic * 100) / 100, 0.15);
    assert.equal(Math.round(norm.completeness * 100) / 100, 0.1);
  });

  it("normalizes integer percentage weights summing to 100", () => {
    const raw = { revenue: 30, industry: 25, employees: 20, geographic: 15, completeness: 10 };
    const norm = normalizeWeights(raw);
    const sum = Object.values(norm).reduce((a, b) => a + b, 0);
    assert.equal(Math.round(sum * 100) / 100, 1.0);
    assert.equal(Math.round(norm.revenue * 100) / 100, 0.3);
  });

  it("falls back to DEFAULT_WEIGHTS when all weights are 0 or empty", () => {
    const raw = { revenue: 0, industry: 0, employees: 0, geographic: 0, completeness: 0 };
    const norm = normalizeWeights(raw);
    assert.deepEqual(norm, DEFAULT_WEIGHTS);
  });
});

