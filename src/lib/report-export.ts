import type { KillResult } from "@/lib/analyze.functions";

/* ---------------- helpers ---------------- */

const verdictEmoji = (v: KillResult["verdict"]) =>
  v === "ship" ? "🚀 SHIP IT" : v === "pivot" ? "⚠️ PIVOT" : "☠️ KILL IT";

const bar = (score: number) => {
  const filled = Math.round(score);
  return `${"█".repeat(filled)}${"░".repeat(10 - filled)} ${score}/10`;
};

const overall = (r: KillResult) => {
  const vals = Object.values(r.scores);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

const list = (items: string[] | undefined, prefix = "- ") =>
  (items ?? []).map((x) => `${prefix}${x}`).join("\n");

const sevEmoji = (s: string) =>
  (({ critical: "🔴🔴", high: "🔴", medium: "🟡", low: "🟢" }) as Record<string, string>)[s] ?? s;

/* ---------------- formats ---------------- */

/** Full structured Markdown — best for pasting into AI agents, Notion, Slack, GitHub issues. */
export function formatAsMarkdown(idea: string, r: KillResult, marketScope?: string): string {
  const ov = overall(r).toFixed(1);
  const s = r.scores;

  const lines: string[] = [];
  lines.push(`# 💀 Kill My Idea — Autopsy Report`);
  lines.push("");
  lines.push(`> **${r.quote}**`);
  lines.push("");
  lines.push(
    `**Verdict:** ${verdictEmoji(r.verdict)}  ·  **Overall:** ${ov}/10  ·  **Category:** ${r.category}`,
  );
  if (marketScope) lines.push(`**Target market:** ${marketScope}`);
  lines.push("");
  lines.push(`## The idea`);
  lines.push("");
  lines.push(`> ${idea.replace(/\n/g, "\n> ")}`);
  lines.push("");
  lines.push(`**In one line:** ${r.one_liner}`);
  lines.push("");
  lines.push(`**Verdict summary:** ${r.verdict_summary}`);
  lines.push("");

  /* Roast */
  lines.push(`## 🔥 The roast`);
  lines.push("");
  lines.push(r.roast);
  lines.push("");

  /* Scores */
  lines.push(`## 📊 Scoring (12 metrics)`);
  lines.push("");
  lines.push("```");
  lines.push(`Market size      ${bar(s.market_size)}`);
  lines.push(`Competition      ${bar(s.competition)}   (10 = blue ocean)`);
  lines.push(`Execution        ${bar(s.execution)}`);
  lines.push(`Timing           ${bar(s.timing)}`);
  lines.push(`Originality      ${bar(s.originality)}`);
  lines.push(`Moat             ${bar(s.moat)}`);
  lines.push(`Demand           ${bar(s.demand)}`);
  lines.push(`Monetization     ${bar(s.monetization)}`);
  lines.push(`Scalability      ${bar(s.scalability)}`);
  lines.push(`Regulatory       ${bar(s.regulatory)}   (10 = unregulated)`);
  lines.push(`Virality         ${bar(s.virality)}`);
  lines.push(`Founder fit      ${bar(s.founder_fit)}`);
  lines.push("```");
  lines.push("");

  /* Market */
  lines.push(`## 🌍 Market intelligence`);
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| TAM | ${r.market.tam} |`);
  lines.push(`| SAM | ${r.market.sam} |`);
  lines.push(`| SOM (Y1) | ${r.market.som} |`);
  lines.push(`| Growth | ${r.market.growth} |`);
  lines.push(`| Maturity | ${r.market.maturity} |`);
  lines.push(`| Target customer | ${r.market.target_customer} |`);
  lines.push(`| Key geographies | ${r.market.geographies?.join(", ") ?? "—"} |`);
  lines.push("");
  if (r.market.trends?.length) {
    lines.push(`**Trends**`);
    lines.push(list(r.market.trends));
    lines.push("");
  }
  if (r.market.red_flags?.length) {
    lines.push(`**Red flags**`);
    lines.push(list(r.market.red_flags));
    lines.push("");
  }

  /* Personas */
  if (r.personas?.length) {
    lines.push(`## 👤 ICP personas`);
    lines.push("");
    for (const p of r.personas) {
      lines.push(`### ${p.name}`);
      lines.push(`- **Who:** ${p.who}`);
      lines.push(`- **Pain:** ${p.pain}`);
      lines.push(`- **Willingness to pay:** ${p.willingness_to_pay}`);
      lines.push(`- **Where to find them:** ${p.where_to_find}`);
      lines.push("");
    }
  }

  /* Competitors */
  if (r.competitors?.length) {
    lines.push(`## ⚔️ Competitive landscape`);
    lines.push("");
    lines.push(`| Competitor | Type | Funding | Strength | Weakness | Threat |`);
    lines.push(`|---|---|---|---|---|---|`);
    for (const c of r.competitors) {
      lines.push(
        `| **${c.name}** | ${c.type} | ${c.funding} | ${c.strength} | ${c.weakness} | ${c.threat_level}/10 |`,
      );
    }
    lines.push("");
  }

  /* Big tech */
  if (r.bigtech_threats?.length) {
    lines.push(`## 🐳 Big-tech threats`);
    lines.push("");
    for (const b of r.bigtech_threats) {
      lines.push(`- **${b.company}** (${b.likelihood}, ${b.timeline}) — ${b.reason}`);
    }
    lines.push("");
  }

  /* Dead clones */
  if (r.similar_dead?.length) {
    lines.push(`## ☠️ Dead clones`);
    lines.push("");
    for (const d of r.similar_dead) {
      lines.push(`- **${d.name}** — ${d.what}. Died ${d.died}: ${d.cause}`);
    }
    lines.push("");
  }

  /* Business model */
  lines.push(`## 💰 Business model`);
  lines.push("");
  if (r.business_model.revenue_streams?.length) {
    lines.push(`**Revenue streams**`);
    lines.push(list(r.business_model.revenue_streams));
    lines.push("");
  }
  if (r.business_model.pricing_tiers?.length) {
    lines.push(`**Pricing tiers**`);
    lines.push(`| Tier | Price | Includes |`);
    lines.push(`|---|---|---|`);
    for (const tier of r.business_model.pricing_tiers) {
      lines.push(`| ${tier.name} | ${tier.price} | ${tier.includes} |`);
    }
    lines.push("");
  }
  const u = r.business_model.unit_economics;
  lines.push(`**Unit economics**`);
  lines.push(`- CAC: ${u.cac_estimate}`);
  lines.push(`- LTV: ${u.ltv_estimate}`);
  lines.push(`- Gross margin: ${u.gross_margin}`);
  lines.push(`- Payback period: ${u.payback_period}`);
  lines.push("");

  /* GTM */
  lines.push(`## 🚀 Go-to-market`);
  lines.push("");
  lines.push(`**Wedge:** ${r.gtm.wedge}`);
  lines.push("");
  lines.push(`**First 100 users:** ${r.gtm.first_100_users}`);
  lines.push("");
  if (r.gtm.channels?.length) {
    lines.push(`**Channels**`);
    for (const c of r.gtm.channels) {
      lines.push(`- **${c.name}** (effort: ${c.effort}) — ${c.why}`);
    }
    lines.push("");
  }
  if (r.gtm.content_angles?.length) {
    lines.push(`**Content angles**`);
    lines.push(list(r.gtm.content_angles));
    lines.push("");
  }

  /* Tech stack */
  const ts = r.tech_stack;
  lines.push(`## 🛠 Tech stack`);
  lines.push("");
  lines.push(`- **Frontend:** ${ts.frontend}`);
  lines.push(`- **Backend:** ${ts.backend}`);
  lines.push(`- **Database:** ${ts.database}`);
  lines.push(`- **AI:** ${ts.ai}`);
  lines.push(`- **Infra:** ${ts.infra}`);
  if (ts.integrations?.length) lines.push(`- **Integrations:** ${ts.integrations.join(", ")}`);
  lines.push(`- **Build time:** ${ts.build_time}`);
  lines.push("");
  lines.push(`> ${ts.rationale}`);
  lines.push("");

  /* MVP prompt */
  lines.push(`## 🤖 MVP prompt (paste into Cursor / v0 / Lovable)`);
  lines.push("");
  lines.push("```");
  lines.push(r.mvp_prompt);
  lines.push("```");
  lines.push("");

  /* Roadmap */
  lines.push(`## 🗺 Roadmap`);
  lines.push("");
  const stages: Array<[string, string[]]> = [
    ["Week 1", r.roadmap.week_1],
    ["Month 1", r.roadmap.month_1],
    ["Month 3", r.roadmap.month_3],
    ["Month 6", r.roadmap.month_6],
    ["Year 1", r.roadmap.year_1],
  ];
  for (const [label, items] of stages) {
    if (!items?.length) continue;
    lines.push(`### ${label}`);
    lines.push(list(items));
    lines.push("");
  }

  /* Risks */
  if (r.risks?.length) {
    lines.push(`## ⚠️ Risks`);
    lines.push("");
    for (const risk of r.risks) {
      lines.push(
        `- ${sevEmoji(risk.severity)} **[${risk.category}] ${risk.risk}** → ${risk.mitigation}`,
      );
    }
    lines.push("");
  }

  /* Kill switches */
  if (r.kill_switches?.length) {
    lines.push(`## 🛑 Kill switches`);
    lines.push(`If any of these happen, walk away:`);
    lines.push(list(r.kill_switches));
    lines.push("");
  }

  /* Names */
  if (r.name_suggestions?.length) {
    lines.push(`## 🏷 Name candidates`);
    for (const n of r.name_suggestions) {
      lines.push(`- **${n.name}** — ${n.rationale}`);
    }
    lines.push("");
  }

  /* Survival kit */
  if (r.survival_kit?.length) {
    lines.push(`## 🎒 Survival kit`);
    lines.push(list(r.survival_kit));
    lines.push("");
  }

  lines.push(`---`);
  lines.push(`*Generated by Kill My Idea — https://killmyidea.es*`);
  return lines.join("\n");
}

/** Wrapped briefing optimized for pasting into ChatGPT / Claude / Gemini to continue working. */
export function formatAsAIBriefing(idea: string, r: KillResult, marketScope?: string): string {
  const md = formatAsMarkdown(idea, r, marketScope);
  return [
    `You are a co-founder assistant. Below is a comprehensive forensic analysis of a startup idea (verdict: ${verdictEmoji(r.verdict)}, score ${overall(r).toFixed(1)}/10).`,
    `Use it as the source of truth. When I ask follow-up questions, reference the specific section. Be as brutally honest as the report.`,
    ``,
    `=== START REPORT ===`,
    md,
    `=== END REPORT ===`,
    ``,
    `Now ask me: "Where do you want to dig deeper — pivot exploration, GTM detail, competitor deep-dive, fundraising prep, or building the MVP?"`,
  ].join("\n");
}

/** Raw JSON — for tooling / scripts / further automation. */
export function formatAsJSON(idea: string, r: KillResult, marketScope?: string): string {
  return JSON.stringify(
    {
      generator: "Kill My Idea",
      url: "https://killmyidea.es",
      generated_at: new Date().toISOString(),
      idea,
      market_scope: marketScope ?? null,
      overall_score: Number(overall(r).toFixed(2)),
      result: r,
    },
    null,
    2,
  );
}

/** Short summary — for tweets / DMs. */
export function formatAsShortSummary(idea: string, r: KillResult): string {
  return [
    `💀 Kill My Idea — ${verdictEmoji(r.verdict)} ${overall(r).toFixed(1)}/10`,
    ``,
    `Idea: ${idea.slice(0, 140)}${idea.length > 140 ? "…" : ""}`,
    ``,
    `"${r.quote}"`,
    ``,
    `Market: ${r.market.tam} · ${r.market.growth}`,
    `Top risk: ${r.risks?.[0]?.risk ?? "—"}`,
    ``,
    `Get yours → killmyidea.es`,
  ].join("\n");
}

/** Trigger a browser file download. */
export function downloadFile(filename: string, content: string, mime = "text/markdown") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "idea"
  );
}
