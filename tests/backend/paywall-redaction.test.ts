import { describe, expect, it } from "vitest";
import { redactResult, type KillResult } from "@/lib/analyze.functions";

const fullResult: KillResult = {
  one_liner: "A useful idea",
  category: "B2B SaaS",
  quote: "Maybe.",
  roast: "This is a roast.",
  scores: {
    market_size: 1,
    competition: 2,
    execution: 3,
    timing: 4,
    originality: 5,
    moat: 6,
    demand: 7,
    monetization: 8,
    scalability: 9,
    regulatory: 10,
    virality: 1,
    founder_fit: 2,
  },
  verdict: "pivot",
  verdict_summary: "Summary",
  market: {
    tam: "premium",
    sam: "premium",
    som: "premium",
    growth: "premium",
    maturity: "growing",
    target_customer: "premium",
    geographies: ["premium"],
    trends: ["premium"],
    red_flags: ["premium"],
  },
  personas: [
    {
      name: "premium",
      who: "premium",
      pain: "premium",
      willingness_to_pay: "premium",
      where_to_find: "premium",
    },
  ],
  competitors: [
    {
      name: "premium",
      type: "startup",
      funding: "premium",
      strength: "premium",
      weakness: "premium",
      threat_level: 9,
    },
  ],
  bigtech_threats: [
    { company: "premium", reason: "premium", likelihood: "high", timeline: "premium" },
  ],
  similar_dead: [{ name: "premium", what: "premium", died: "premium", cause: "premium" }],
  business_model: {
    revenue_streams: ["premium"],
    pricing_tiers: [{ name: "premium", price: "premium", includes: "premium" }],
    unit_economics: {
      cac_estimate: "premium",
      ltv_estimate: "premium",
      gross_margin: "premium",
      payback_period: "premium",
    },
  },
  gtm: {
    channels: [{ name: "premium", why: "premium", effort: "high" }],
    first_100_users: "premium",
    content_angles: ["premium"],
    wedge: "premium",
  },
  tech_stack: {
    frontend: "premium",
    backend: "premium",
    database: "premium",
    ai: "premium",
    infra: "premium",
    integrations: ["premium"],
    rationale: "premium",
    build_time: "premium",
  },
  mvp_prompt: "premium",
  roadmap: {
    week_1: ["premium"],
    month_1: ["premium"],
    month_3: ["premium"],
    month_6: ["premium"],
    year_1: ["premium"],
  },
  risks: [{ category: "market", risk: "premium", mitigation: "premium", severity: "high" }],
  kill_switches: ["premium"],
  name_suggestions: [{ name: "premium", rationale: "premium" }],
  survival_kit: ["premium"],
};

describe("redactResult", () => {
  it("keeps free verdict fields and removes premium report sections", () => {
    const redacted = redactResult(fullResult);

    expect(redacted.one_liner).toBe(fullResult.one_liner);
    expect(redacted.scores).toEqual(fullResult.scores);
    expect(redacted.market.tam).toBe("");
    expect(redacted.personas).toEqual([]);
    expect(redacted.mvp_prompt).toBe("");
    expect(redacted.survival_kit).toEqual([]);
  });
});
