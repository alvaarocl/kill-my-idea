// Generic prompts so the app runs out of the box. Production uses ./private.ts,
// which is not in the repository. Same shape: the schema keys must match `KillResult`.
import type { PromptInput, PromptPack } from "./types";

export const analysisJsonSchema = {
  type: "object",
  properties: {
    one_liner: {
      type: "string",
    },
    category: {
      type: "string",
    },
    quote: {
      type: "string",
    },
    roast: {
      type: "string",
    },
    scores: {
      type: "object",
      properties: {
        market_size: {
          type: "number",
        },
        competition: {
          type: "number",
        },
        execution: {
          type: "number",
        },
        timing: {
          type: "number",
        },
        originality: {
          type: "number",
        },
        moat: {
          type: "number",
        },
        demand: {
          type: "number",
        },
        monetization: {
          type: "number",
        },
        scalability: {
          type: "number",
        },
        regulatory: {
          type: "number",
        },
        virality: {
          type: "number",
        },
        founder_fit: {
          type: "number",
        },
      },
      required: [
        "market_size",
        "competition",
        "execution",
        "timing",
        "originality",
        "moat",
        "demand",
        "monetization",
        "scalability",
        "regulatory",
        "virality",
        "founder_fit",
      ],
      additionalProperties: false,
    },
    verdict: {
      type: "string",
      enum: ["ship", "pivot", "kill"],
    },
    verdict_summary: {
      type: "string",
    },
    market: {
      type: "object",
      properties: {
        tam: {
          type: "string",
        },
        sam: {
          type: "string",
        },
        som: {
          type: "string",
        },
        growth: {
          type: "string",
        },
        maturity: {
          type: "string",
          enum: ["emerging", "growing", "mature", "declining"],
        },
        target_customer: {
          type: "string",
        },
        geographies: {
          type: "array",
          items: {
            type: "string",
          },
        },
        trends: {
          type: "array",
          items: {
            type: "string",
          },
        },
        red_flags: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: [
        "tam",
        "sam",
        "som",
        "growth",
        "maturity",
        "target_customer",
        "geographies",
        "trends",
        "red_flags",
      ],
      additionalProperties: false,
    },
    personas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          who: {
            type: "string",
          },
          pain: {
            type: "string",
          },
          willingness_to_pay: {
            type: "string",
          },
          where_to_find: {
            type: "string",
          },
        },
        required: ["name", "who", "pain", "willingness_to_pay", "where_to_find"],
        additionalProperties: false,
      },
    },
    competitors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          type: {
            type: "string",
            enum: ["indie", "startup", "scaleup", "incumbent", "bigtech", "open_source"],
          },
          funding: {
            type: "string",
          },
          strength: {
            type: "string",
          },
          weakness: {
            type: "string",
          },
          threat_level: {
            type: "number",
          },
        },
        required: ["name", "type", "funding", "strength", "weakness", "threat_level"],
        additionalProperties: false,
      },
    },
    bigtech_threats: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: {
            type: "string",
          },
          reason: {
            type: "string",
          },
          likelihood: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          timeline: {
            type: "string",
          },
        },
        required: ["company", "reason", "likelihood", "timeline"],
        additionalProperties: false,
      },
    },
    similar_dead: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          what: {
            type: "string",
          },
          died: {
            type: "string",
          },
          cause: {
            type: "string",
          },
        },
        required: ["name", "what", "died", "cause"],
        additionalProperties: false,
      },
    },
    business_model: {
      type: "object",
      properties: {
        revenue_streams: {
          type: "array",
          items: {
            type: "string",
          },
        },
        pricing_tiers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              price: {
                type: "string",
              },
              includes: {
                type: "string",
              },
            },
            required: ["name", "price", "includes"],
            additionalProperties: false,
          },
        },
        unit_economics: {
          type: "object",
          properties: {
            cac_estimate: {
              type: "string",
            },
            ltv_estimate: {
              type: "string",
            },
            gross_margin: {
              type: "string",
            },
            payback_period: {
              type: "string",
            },
          },
          required: ["cac_estimate", "ltv_estimate", "gross_margin", "payback_period"],
          additionalProperties: false,
        },
      },
      required: ["revenue_streams", "pricing_tiers", "unit_economics"],
      additionalProperties: false,
    },
    gtm: {
      type: "object",
      properties: {
        channels: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              why: {
                type: "string",
              },
              effort: {
                type: "string",
                enum: ["low", "medium", "high"],
              },
            },
            required: ["name", "why", "effort"],
            additionalProperties: false,
          },
        },
        first_100_users: {
          type: "string",
        },
        content_angles: {
          type: "array",
          items: {
            type: "string",
          },
        },
        wedge: {
          type: "string",
        },
      },
      required: ["channels", "first_100_users", "content_angles", "wedge"],
      additionalProperties: false,
    },
    tech_stack: {
      type: "object",
      properties: {
        frontend: {
          type: "string",
        },
        backend: {
          type: "string",
        },
        database: {
          type: "string",
        },
        ai: {
          type: "string",
        },
        infra: {
          type: "string",
        },
        integrations: {
          type: "array",
          items: {
            type: "string",
          },
        },
        rationale: {
          type: "string",
        },
        build_time: {
          type: "string",
        },
      },
      required: [
        "frontend",
        "backend",
        "database",
        "ai",
        "infra",
        "integrations",
        "rationale",
        "build_time",
      ],
      additionalProperties: false,
    },
    mvp_prompt: {
      type: "string",
    },
    roadmap: {
      type: "object",
      properties: {
        week_1: {
          type: "array",
          items: {
            type: "string",
          },
        },
        month_1: {
          type: "array",
          items: {
            type: "string",
          },
        },
        month_3: {
          type: "array",
          items: {
            type: "string",
          },
        },
        month_6: {
          type: "array",
          items: {
            type: "string",
          },
        },
        year_1: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["week_1", "month_1", "month_3", "month_6", "year_1"],
      additionalProperties: false,
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["legal", "technical", "market", "team", "financial"],
          },
          risk: {
            type: "string",
          },
          mitigation: {
            type: "string",
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
          },
        },
        required: ["category", "risk", "mitigation", "severity"],
        additionalProperties: false,
      },
    },
    kill_switches: {
      type: "array",
      items: {
        type: "string",
      },
    },
    name_suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          rationale: {
            type: "string",
          },
        },
        required: ["name", "rationale"],
        additionalProperties: false,
      },
    },
    survival_kit: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "one_liner",
    "category",
    "quote",
    "roast",
    "scores",
    "verdict",
    "verdict_summary",
    "market",
    "personas",
    "competitors",
    "bigtech_threats",
    "similar_dead",
    "business_model",
    "gtm",
    "tech_stack",
    "mvp_prompt",
    "roadmap",
    "risks",
    "kill_switches",
    "name_suggestions",
    "survival_kit",
  ],
  additionalProperties: false,
} as const;

export function build({ lang, idea, market, context }: PromptInput) {
  const language = lang === "es" ? "Spanish" : "English";
  const scope = market?.trim() ? `\nFocus the analysis on this market: ${market.trim()}.` : "";
  const extra = context?.trim() ? `\nExtra context from the founder:\n"""${context.trim()}"""` : "";
  return {
    system:
      `You are a startup advisor. Analyse the idea and fill every field of submit_analysis. ` +
      `Score each dimension from 0 to 10; verdict is "ship" when the average is 7 or more, "pivot" from 4 to 6.9 and "kill" below 4. ` +
      `Write free text in ${language}; keep enum values in lowercase English.${scope}${extra}`,
    user: `Analyse this startup idea:\n\n"""${idea}"""`,
  };
}

export default { analysisJsonSchema, build } satisfies PromptPack;
