import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "es";

const STORAGE_KEY = "kmi:lang";

type Dict = {
  // Header
  "nav.how": string;
  "nav.features": string;
  "nav.faq": string;
  "nav.cta": string;

  // Hero
  "hero.badge": string;
  "hero.title.line1": string;
  "hero.title.line2a": string;
  "hero.title.line2b": string;
  "hero.title.dot": string;
  "hero.subtitle": string;
  "hero.cta.primary": string;
  "hero.cta.secondary": string;
  "hero.trust.1": string;
  "hero.trust.2": string;
  "hero.trust.3": string;

  // Bento features
  "features.eyebrow": string;
  "features.title.line1": string;
  "features.title.line2a": string;
  "features.title.line2b": string;
  "features.roast.eyebrow": string;
  "features.roast.body.before": string;
  "features.roast.body.accent": string;
  "features.roast.body.after": string;
  "features.roast.sample": string;
  "features.verdict.eyebrow": string;
  "features.verdict.ship": string;
  "features.verdict.pivot": string;
  "features.verdict.kill": string;
  "features.verdict.note": string;
  "features.scores.eyebrow": string;
  "metric.market_size": string;
  "metric.competition": string;
  "metric.execution": string;
  "metric.timing": string;
  "metric.originality": string;
  "metric.moat": string;
  "metric.demand": string;
  "metric.monetization": string;
  "metric.scalability": string;
  "metric.regulatory": string;
  "metric.virality": string;
  "metric.founder_fit": string;

  // Landing — deep output preview
  "deep.eyebrow": string;
  "deep.title.a": string;
  "deep.title.b": string;
  "deep.subtitle": string;
  "deep.item.scores": string;
  "deep.item.scores.body": string;
  "deep.item.market": string;
  "deep.item.market.body": string;
  "deep.item.personas": string;
  "deep.item.personas.body": string;
  "deep.item.competitors": string;
  "deep.item.competitors.body": string;
  "deep.item.bigtech": string;
  "deep.item.bigtech.body": string;
  "deep.item.dead": string;
  "deep.item.dead.body": string;
  "deep.item.model": string;
  "deep.item.model.body": string;
  "deep.item.gtm": string;
  "deep.item.gtm.body": string;
  "deep.item.stack": string;
  "deep.item.stack.body": string;
  "deep.item.prompt": string;
  "deep.item.prompt.body": string;
  "deep.item.roadmap": string;
  "deep.item.roadmap.body": string;
  "deep.item.risks": string;
  "deep.item.risks.body": string;
  "deep.item.names": string;
  "deep.item.names.body": string;
  "features.market.eyebrow": string;
  "features.market.body": string;
  "features.kit.eyebrow": string;
  "features.kit.body": string;
  "features.kit.sample.1": string;
  "features.kit.sample.2": string;
  "features.kit.sample.3": string;

  // How it works
  "how.eyebrow": string;
  "how.title.a": string;
  "how.title.b": string;
  "how.step1.title": string;
  "how.step1.body": string;
  "how.step2.title": string;
  "how.step2.body": string;
  "how.step3.title": string;
  "how.step3.body": string;

  // Sample
  "sample.eyebrow": string;
  "sample.title": string;
  "sample.casefile": string;
  "sample.verdictTag": string;
  "sample.idea": string;
  "sample.roast.eyebrow": string;
  "sample.roast.body": string;
  "sample.tam.eyebrow": string;
  "sample.tam.value": string;
  "sample.tam.note": string;
  "sample.cta": string;

  // FAQ
  "faq.eyebrow": string;
  "faq.title": string;
  "faq.q1": string;
  "faq.a1": string;
  "faq.q2": string;
  "faq.a2": string;
  "faq.q3": string;
  "faq.a3": string;
  "faq.q4": string;
  "faq.a4": string;

  // Final CTA
  "finalcta.title.a": string;
  "finalcta.title.b": string;
  "finalcta.body": string;
  "finalcta.button": string;

  // Footer
  "footer.tag": string;

  // /kill page
  "kill.back": string;
  "kill.title.a": string;
  "kill.title.b": string;
  "kill.subtitle": string;
  "kill.placeholder.1": string;
  "kill.placeholder.2": string;
  "kill.placeholder.3": string;
  "kill.placeholder.4": string;
  "kill.kbdHint": string;
  "kill.submit": string;
  "kill.tryThese": string;
  "kill.advanced.toggle": string;
  "kill.advanced.marketLabel": string;
  "kill.advanced.marketPlaceholder": string;
  "kill.advanced.marketHint": string;
  "kill.advanced.contextLabel": string;
  "kill.advanced.contextPlaceholder": string;
  "kill.advanced.contextHint": string;
  "kill.loading.1": string;
  "kill.loading.2": string;
  "kill.loading.3": string;
  "kill.loading.4": string;
  "kill.loading.5": string;
  "kill.loading.6": string;
  "kill.loading.7": string;
  "kill.loading.note": string;

  // /autopsy page
  "autopsy.eyebrow": string;
  "autopsy.title": string;
  "autopsy.share": string;
  "autopsy.share.full": string;
  "autopsy.share.label": string;
  "autopsy.share.markdown": string;
  "autopsy.share.markdown.hint": string;
  "autopsy.share.ai": string;
  "autopsy.share.ai.hint": string;
  "autopsy.share.json": string;
  "autopsy.share.json.hint": string;
  "autopsy.share.short": string;
  "autopsy.share.short.hint": string;
  "autopsy.share.download.md": string;
  "autopsy.share.download.json": string;
  "autopsy.copied": string;
  "autopsy.newIdea": string;
  "autopsy.submitted": string;
  "autopsy.roast": string;
  "autopsy.verdict": string;
  "autopsy.overall": string;
  "autopsy.signal.strong": string;
  "autopsy.signal.mixed": string;
  "autopsy.signal.weak": string;
  "autopsy.scores": string;
  "autopsy.market": string;
  "autopsy.market.tam": string;
  "autopsy.market.sam": string;
  "autopsy.market.som": string;
  "autopsy.market.growth": string;
  "autopsy.market.maturity": string;
  "autopsy.market.customer": string;
  "autopsy.market.geographies": string;
  "autopsy.market.trends": string;
  "autopsy.market.competitors": string;
  "autopsy.market.redflags": string;
  "autopsy.kit.pivot": string;
  "autopsy.kit.survival": string;
  "autopsy.cta": string;
  "autopsy.category": string;
  "autopsy.quote": string;
  "autopsy.verdict.summary": string;
  "autopsy.personas": string;
  "autopsy.persona.who": string;
  "autopsy.persona.pain": string;
  "autopsy.persona.wtp": string;
  "autopsy.persona.find": string;
  "autopsy.competitors": string;
  "autopsy.competitors.threat": string;
  "autopsy.bigtech": string;
  "autopsy.bigtech.likelihood": string;
  "autopsy.bigtech.timeline": string;
  "autopsy.dead": string;
  "autopsy.dead.cause": string;
  "autopsy.model": string;
  "autopsy.model.revenue": string;
  "autopsy.model.pricing": string;
  "autopsy.model.unit": string;
  "autopsy.model.cac": string;
  "autopsy.model.ltv": string;
  "autopsy.model.margin": string;
  "autopsy.model.payback": string;
  "autopsy.gtm": string;
  "autopsy.gtm.wedge": string;
  "autopsy.gtm.channels": string;
  "autopsy.gtm.first100": string;
  "autopsy.gtm.content": string;
  "autopsy.stack": string;
  "autopsy.stack.frontend": string;
  "autopsy.stack.backend": string;
  "autopsy.stack.db": string;
  "autopsy.stack.ai": string;
  "autopsy.stack.infra": string;
  "autopsy.stack.integrations": string;
  "autopsy.stack.build": string;
  "autopsy.prompt": string;
  "autopsy.prompt.note": string;
  "autopsy.prompt.copy": string;
  "autopsy.prompt.copied": string;
  "autopsy.roadmap": string;
  "autopsy.roadmap.w1": string;
  "autopsy.roadmap.m1": string;
  "autopsy.roadmap.m3": string;
  "autopsy.roadmap.m6": string;
  "autopsy.roadmap.y1": string;
  "autopsy.risks": string;
  "autopsy.killswitches": string;
  "autopsy.names": string;
  "autopsy.effort": string;

  // Verdict labels & taglines
  "verdict.ship.label": string;
  "verdict.ship.tag": string;
  "verdict.pivot.label": string;
  "verdict.pivot.tag": string;
  "verdict.kill.label": string;
  "verdict.kill.tag": string;
};

const en: Dict = {
  "nav.how": "How it works",
  "nav.features": "What you get",
  "nav.faq": "FAQ",
  "nav.cta": "Try it",

  "hero.badge": "Brutal honesty. Zero sugarcoating.",
  "hero.title.line1": "Your startup idea",
  "hero.title.line2a": "deserves an ",
  "hero.title.line2b": "autopsy",
  "hero.title.dot": ".",
  "hero.subtitle":
    "A merciless AI advisor that names real competitors, estimates your TAM, flags non-obvious risks, and tells you to ship, pivot, or quietly walk away.",
  "hero.cta.primary": "Kill my idea",
  "hero.cta.secondary": "See a sample autopsy",
  "hero.trust.1": "✓ 90-second autopsy",
  "hero.trust.2": "✓ No signup",
  "hero.trust.3": "✓ Real competitors, real numbers",

  "features.eyebrow": "What you get",
  "features.title.line1": "Not a vibe check.",
  "features.title.line2a": "A ",
  "features.title.line2b": "forensic report",
  "features.roast.eyebrow": "The roast",
  "features.roast.body.before": "3–4 sentences. Witty, sharp, specific. References ",
  "features.roast.body.accent": "dead clones",
  "features.roast.body.after": " and real market signals — not generic AI hedging.",
  "features.roast.sample":
    "Another AI-powered to-do list, in 2026? Cool. Todoist still has 30M users, Notion already ate the productivity tail, and your differentiator is \"but with AI\". You're not building a product, you're building a feature someone else will ship in a sprint.",
  "features.verdict.eyebrow": "Verdict",
  "features.verdict.ship": "Ship",
  "features.verdict.pivot": "Pivot",
  "features.verdict.kill": "Kill",
  "features.verdict.note": 'One clear call. No "it depends."',
  "features.scores.eyebrow": "6-metric autopsy",
  "metric.market_size": "Market size",
  "metric.competition": "Competition",
  "metric.execution": "Execution",
  "metric.timing": "Timing",
  "metric.originality": "Originality",
  "metric.moat": "Moat potential",
  "metric.demand": "Real demand",
  "metric.monetization": "Monetization",
  "metric.scalability": "Scalability",
  "metric.regulatory": "Regulatory ease",
  "metric.virality": "Virality",
  "metric.founder_fit": "Founder fit",

  "deep.eyebrow": "Inside the report",
  "deep.title.a": "What's in your ",
  "deep.title.b": "autopsy",
  "deep.subtitle":
    "20+ sections. Every angle a real VC would interrogate before writing the check.",
  "deep.item.scores": "12-metric score",
  "deep.item.scores.body":
    "Market, demand, moat, timing, virality, regulation, scalability, monetization, founder fit and more.",
  "deep.item.market": "TAM · SAM · SOM",
  "deep.item.market.body":
    "Sized markets, growth signal, maturity, top geographies and macro trends shaping the space.",
  "deep.item.personas": "3 ICP personas",
  "deep.item.personas.body": "Who pays, what they pay, where they hang out — ranked by promise.",
  "deep.item.competitors": "Competitor map",
  "deep.item.competitors.body":
    "5–7 named players with funding, strength, weakness and threat level.",
  "deep.item.bigtech": "Big-tech threats",
  "deep.item.bigtech.body":
    "Who at Google, Apple, OpenAI, Notion or Salesforce could crush you with a feature.",
  "deep.item.dead": "Dead clones",
  "deep.item.dead.body": "Real companies that tried this and died — with cause of death.",
  "deep.item.model": "Business model",
  "deep.item.model.body": "Revenue streams, suggested pricing tiers, CAC / LTV / margin / payback.",
  "deep.item.gtm": "Go-to-market",
  "deep.item.gtm.body": "The wedge, ranked channels, first-100-users tactic and content angles.",
  "deep.item.stack": "Tech stack",
  "deep.item.stack.body":
    "Pragmatic recommendation across frontend, backend, DB, AI, infra and integrations.",
  "deep.item.prompt": "MVP prompt",
  "deep.item.prompt.body":
    "Copy-paste this into Lovable / Cursor / v0 to scaffold the MVP in minutes.",
  "deep.item.roadmap": "Phased roadmap",
  "deep.item.roadmap.body": "Week 1 → Year 1 milestones. No fluff, just shippable bets.",
  "deep.item.risks": "Risks + mitigations",
  "deep.item.risks.body":
    "Legal, technical, market, team and financial — each with severity and how to defuse it.",
  "deep.item.names": "Brand names",
  "deep.item.names.body": "5 candidate names with rationale, ready to test domains on.",
  "features.market.eyebrow": "Market research",
  "features.market.body": "Named competitors. TAM estimate. Growth signal. Non-obvious red flags.",
  "features.kit.eyebrow": "Survival kit",
  "features.kit.body":
    "3 concrete next steps for the next 7 days. Or 3 pivot directions if you should kill it.",
  "features.kit.sample.1": "Interview 10 target users this week.",
  "features.kit.sample.2": "Ship a 1-page landing with a waitlist.",
  "features.kit.sample.3": "Charge $1 to validate willingness to pay.",

  "how.eyebrow": "How it works",
  "how.title.a": "Three steps. ",
  "how.title.b": "Ninety seconds.",
  "how.step1.title": "Describe your idea",
  "how.step1.body":
    "Drop a sentence or a paragraph. The more honest you are, the sharper the roast.",
  "how.step2.title": "We run the autopsy",
  "how.step2.body":
    "AI cross-references market signals, named competitors, timing, and feasibility.",
  "how.step3.title": "Get your verdict",
  "how.step3.body": "Ship, pivot, or kill — plus a 3-step survival kit for the next 7 days.",

  "sample.eyebrow": "Sample autopsy",
  "sample.title": "This is what you'll get back.",
  "sample.casefile": "CASE FILE / 0001",
  "sample.verdictTag": "☠ KILL IT",
  "sample.idea": '"Uber for dog walkers, but only on Sundays, with NFTs."',
  "sample.roast.eyebrow": "The roast",
  "sample.roast.body":
    "You've combined three dead trends into one. Rover already owns the dog-walking marketplace, Sundays cuts your TAM by 86%, and NFTs are about as 2022 as it gets. This isn't a startup, it's a Madlibs of 2021 venture decks.",
  "sample.tam.eyebrow": "TAM",
  "sample.tam.value": "~$40M",
  "sample.tam.note": "Declining 12% YoY. Brutal CAC.",
  "sample.cta": "Roast my idea instead",

  "faq.eyebrow": "FAQ",
  "faq.title": "Asked & answered.",
  "faq.q1": "Is this just an AI saying mean things?",
  "faq.a1":
    "No. It cross-references real competitors, market direction, timing, and execution risk — then turns that into a sharp, specific roast. The goal is to save you 6 months of building the wrong thing.",
  "faq.q2": "Will it kill every idea?",
  "faq.a2":
    "No. Strong ideas get a 'ship' verdict with the next 3 validation steps. Weak ones get a 'kill' with 3 pivot directions. Most land on 'pivot'.",
  "faq.q3": "Do you store my idea?",
  "faq.a3":
    "No account, no database. Your idea is sent to the AI for analysis and that's it — the result lives in your browser session.",
  "faq.q4": "How is this different from ChatGPT?",
  "faq.a4":
    "Vanilla ChatGPT will hedge, flatter, and give you a tidy SWOT. Kill My Idea is opinionated, structured, and built to be brutally honest.",

  "finalcta.title.a": "Stop guessing.",
  "finalcta.title.b": "Get the autopsy.",
  "finalcta.body": "90 seconds to find out if you're building a unicorn or a side project.",
  "finalcta.button": "Kill my idea",

  "footer.tag": "Made with brutal honesty.",

  "kill.back": "← Back home",
  "kill.title.a": "Describe your",
  "kill.title.b": "startup idea.",
  "kill.subtitle": "Be specific. The sharper your pitch, the sharper the roast.",
  "kill.placeholder.1": "A Notion competitor focused on tax accountants…",
  "kill.placeholder.2": "Uber for dog walkers, but Sundays only…",
  "kill.placeholder.3": "An AI agent that replies to my Hinge matches…",
  "kill.placeholder.4": "A SaaS that summarizes Slack threads into emails…",
  "kill.kbdHint": "to submit",
  "kill.submit": "Run the autopsy",
  "kill.tryThese": "Or try one of these",
  "kill.advanced.toggle": "Add context or target market",
  "kill.advanced.marketLabel": "Target market",
  "kill.advanced.marketPlaceholder": "e.g. Spain, LATAM, EU SMBs, Japan only…",
  "kill.advanced.marketHint":
    "We'll focus TAM/SAM/SOM, competitors, regulation and channels on this geography.",
  "kill.advanced.contextLabel": "Extra context or rebuttal",
  "kill.advanced.contextPlaceholder":
    "Add anything the AI should know: traction, why a previous roast is wrong, constraints, founder background…",
  "kill.advanced.contextHint":
    "Push back on assumptions. The AI will take this into account before scoring.",
  "kill.loading.1": "Reading your pitch out loud…",
  "kill.loading.2": "Counting your competitors…",
  "kill.loading.3": "Looking for the 47 dead clones…",
  "kill.loading.4": "Asking VCs why they'd pass…",
  "kill.loading.5": "Estimating the TAM honestly…",
  "kill.loading.6": "Checking the timing graveyard…",
  "kill.loading.7": "Sharpening the knife…",
  "kill.loading.note":
    "Cross-referencing market signals, competitors, and timing. Usually 60–90 seconds.",

  "autopsy.eyebrow": "Case file",
  "autopsy.title": "Autopsy report",
  "autopsy.share": "Share",
  "autopsy.share.full": "Share full report",
  "autopsy.share.label": "Copy or download the full autopsy",
  "autopsy.share.markdown": "Copy full report (Markdown)",
  "autopsy.share.markdown.hint": "Paste into Notion, Slack, GitHub or a doc.",
  "autopsy.share.ai": "Copy as AI briefing",
  "autopsy.share.ai.hint": "Paste into ChatGPT, Claude or Gemini to keep iterating.",
  "autopsy.share.json": "Copy as JSON",
  "autopsy.share.json.hint": "For scripts, automations or your own dashboard.",
  "autopsy.share.short": "Copy short summary",
  "autopsy.share.short.hint": "One-paragraph version for tweets or DMs.",
  "autopsy.share.download.md": "Download .md file",
  "autopsy.share.download.json": "Download .json file",
  "autopsy.copied": "✓ Copied",
  "autopsy.newIdea": "New idea",
  "autopsy.submitted": "Submitted idea",
  "autopsy.roast": "The roast",
  "autopsy.verdict": "Verdict",
  "autopsy.overall": "Overall",
  "autopsy.signal.strong": "Strong signal",
  "autopsy.signal.mixed": "Mixed signal",
  "autopsy.signal.weak": "Weak signal",
  "autopsy.scores": "Score breakdown",
  "autopsy.market": "Market research",
  "autopsy.market.tam": "TAM",
  "autopsy.market.sam": "SAM",
  "autopsy.market.som": "SOM (Y1 realistic)",
  "autopsy.market.growth": "Growth signal",
  "autopsy.market.maturity": "Market maturity",
  "autopsy.market.customer": "Target customer",
  "autopsy.market.geographies": "Top geographies",
  "autopsy.market.trends": "Macro trends",
  "autopsy.market.competitors": "Competitors",
  "autopsy.market.redflags": "⚠ Red flags",
  "autopsy.kit.pivot": "Pivot directions",
  "autopsy.kit.survival": "Survival kit · next 7 days",
  "autopsy.cta": "Kill another idea",
  "autopsy.category": "Category",
  "autopsy.quote": "Pull quote",
  "autopsy.verdict.summary": "Why this verdict",
  "autopsy.personas": "ICP personas",
  "autopsy.persona.who": "Who",
  "autopsy.persona.pain": "Pain",
  "autopsy.persona.wtp": "Willingness to pay",
  "autopsy.persona.find": "Where to find them",
  "autopsy.competitors": "Competitor map",
  "autopsy.competitors.threat": "Threat",
  "autopsy.bigtech": "Big-tech threats",
  "autopsy.bigtech.likelihood": "Likelihood",
  "autopsy.bigtech.timeline": "Timeline",
  "autopsy.dead": "Dead clones",
  "autopsy.dead.cause": "Cause of death",
  "autopsy.model": "Business model",
  "autopsy.model.revenue": "Revenue streams",
  "autopsy.model.pricing": "Suggested pricing",
  "autopsy.model.unit": "Unit economics",
  "autopsy.model.cac": "CAC",
  "autopsy.model.ltv": "LTV",
  "autopsy.model.margin": "Gross margin",
  "autopsy.model.payback": "Payback",
  "autopsy.gtm": "Go-to-market",
  "autopsy.gtm.wedge": "The wedge",
  "autopsy.gtm.channels": "Channels",
  "autopsy.gtm.first100": "First 100 users",
  "autopsy.gtm.content": "Content angles",
  "autopsy.stack": "Recommended tech stack",
  "autopsy.stack.frontend": "Frontend",
  "autopsy.stack.backend": "Backend",
  "autopsy.stack.db": "Database",
  "autopsy.stack.ai": "AI",
  "autopsy.stack.infra": "Infra",
  "autopsy.stack.integrations": "Integrations",
  "autopsy.stack.build": "Time to MVP",
  "autopsy.prompt": "MVP prompt",
  "autopsy.prompt.note": "Paste this into Lovable, Cursor or v0 to scaffold the MVP.",
  "autopsy.prompt.copy": "Copy prompt",
  "autopsy.prompt.copied": "✓ Copied",
  "autopsy.roadmap": "Roadmap",
  "autopsy.roadmap.w1": "Week 1",
  "autopsy.roadmap.m1": "Month 1",
  "autopsy.roadmap.m3": "Month 3",
  "autopsy.roadmap.m6": "Month 6",
  "autopsy.roadmap.y1": "Year 1",
  "autopsy.risks": "Risks & mitigations",
  "autopsy.killswitches": "Kill switches",
  "autopsy.names": "Brand name candidates",
  "autopsy.effort": "Effort",

  "verdict.ship.label": "SHIP IT",
  "verdict.ship.tag": "This one might actually work. Move fast.",
  "verdict.pivot.label": "PIVOT FIRST",
  "verdict.pivot.tag": "There's something here. Just not in this shape.",
  "verdict.kill.label": "KILL IT",
  "verdict.kill.tag": "Save your weekends. Try something else.",
};

const es: Dict = {
  "nav.how": "Cómo funciona",
  "nav.features": "Qué obtienes",
  "nav.faq": "FAQ",
  "nav.cta": "Probar",

  "hero.badge": "Honestidad brutal. Cero edulcorante.",
  "hero.title.line1": "Tu idea de startup",
  "hero.title.line2a": "merece una ",
  "hero.title.line2b": "autopsia",
  "hero.title.dot": ".",
  "hero.subtitle":
    "Un asesor de IA despiadado que nombra competidores reales, estima tu TAM, señala riesgos no obvios y te dice si lanzar, pivotar o retirarte en silencio.",
  "hero.cta.primary": "Mata mi idea",
  "hero.cta.secondary": "Ver una autopsia de ejemplo",
  "hero.trust.1": "✓ Autopsia en 90 segundos",
  "hero.trust.2": "✓ Sin registro",
  "hero.trust.3": "✓ Competidores reales, números reales",

  "features.eyebrow": "Qué obtienes",
  "features.title.line1": 'No es un "buen rollo".',
  "features.title.line2a": "Es un ",
  "features.title.line2b": "informe forense",
  "features.roast.eyebrow": "El roast",
  "features.roast.body.before": "3–4 frases. Ingeniosas, afiladas, específicas. Cita ",
  "features.roast.body.accent": "clones muertos",
  "features.roast.body.after": " y señales reales de mercado — sin titubeos genéricos de IA.",
  "features.roast.sample":
    '¿Otra to-do list con IA, en 2026? Genial. Todoist sigue con 30M de usuarios, Notion ya se comió la cola del mercado de productividad, y tu diferenciador es "pero con IA". No estás construyendo un producto, estás construyendo una feature que cualquiera ship en un sprint.',
  "features.verdict.eyebrow": "Veredicto",
  "features.verdict.ship": "Lanza",
  "features.verdict.pivot": "Pivota",
  "features.verdict.kill": "Mata",
  "features.verdict.note": 'Una decisión clara. Sin "depende".',
  "features.scores.eyebrow": "Autopsia · 6 métricas",
  "metric.market_size": "Tamaño de mercado",
  "metric.competition": "Competencia",
  "metric.execution": "Ejecución",
  "metric.timing": "Timing",
  "metric.originality": "Originalidad",
  "metric.moat": "Defensibilidad",
  "metric.demand": "Demanda real",
  "metric.monetization": "Monetización",
  "metric.scalability": "Escalabilidad",
  "metric.regulatory": "Facilidad regulatoria",
  "metric.virality": "Viralidad",
  "metric.founder_fit": "Encaje del founder",

  "deep.eyebrow": "Dentro del informe",
  "deep.title.a": "Qué hay en tu ",
  "deep.title.b": "autopsia",
  "deep.subtitle":
    "20+ secciones. Cada ángulo que un VC de verdad interrogaría antes de firmar el cheque.",
  "deep.item.scores": "Score · 12 métricas",
  "deep.item.scores.body":
    "Mercado, demanda, moat, timing, viralidad, regulación, escalabilidad, monetización, encaje del founder y más.",
  "deep.item.market": "TAM · SAM · SOM",
  "deep.item.market.body":
    "Mercados dimensionados, crecimiento, madurez, top geografías y tendencias macro.",
  "deep.item.personas": "3 personas ICP",
  "deep.item.personas.body":
    "Quién paga, cuánto paga y dónde encontrarlos — ordenados por potencial.",
  "deep.item.competitors": "Mapa de competidores",
  "deep.item.competitors.body":
    "5–7 jugadores con nombre, funding, fortaleza, debilidad y nivel de amenaza.",
  "deep.item.bigtech": "Amenazas big-tech",
  "deep.item.bigtech.body":
    "Quién en Google, Apple, OpenAI, Notion o Salesforce puede aplastarte con una feature.",
  "deep.item.dead": "Clones muertos",
  "deep.item.dead.body": "Empresas reales que lo intentaron y murieron — con causa de muerte.",
  "deep.item.model": "Modelo de negocio",
  "deep.item.model.body": "Fuentes de ingreso, pricing sugerido, CAC / LTV / margen / payback.",
  "deep.item.gtm": "Go-to-market",
  "deep.item.gtm.body":
    "El wedge, canales priorizados, táctica para los primeros 100 usuarios y ángulos de contenido.",
  "deep.item.stack": "Stack técnico",
  "deep.item.stack.body":
    "Recomendación pragmática de frontend, backend, BBDD, IA, infra e integraciones.",
  "deep.item.prompt": "Prompt para el MVP",
  "deep.item.prompt.body":
    "Pega esto en Lovable / Cursor / v0 y tienes el MVP arrancado en minutos.",
  "deep.item.roadmap": "Roadmap por fases",
  "deep.item.roadmap.body": "De la semana 1 al año 1. Sin paja, solo apuestas que se shippean.",
  "deep.item.risks": "Riesgos + mitigaciones",
  "deep.item.risks.body":
    "Legal, técnico, mercado, equipo y financiero — cada uno con severidad y cómo desactivarlo.",
  "deep.item.names": "Nombres de marca",
  "deep.item.names.body": "5 nombres candidatos con su porqué, listos para probar dominios.",
  "features.market.eyebrow": "Investigación de mercado",
  "features.market.body":
    "Competidores con nombre y apellido. Estimación de TAM. Señal de crecimiento. Red flags no obvias.",
  "features.kit.eyebrow": "Kit de supervivencia",
  "features.kit.body":
    "3 pasos concretos para los próximos 7 días. O 3 direcciones de pivote si toca matarla.",
  "features.kit.sample.1": "Entrevista a 10 usuarios objetivo esta semana.",
  "features.kit.sample.2": "Lanza una landing de 1 página con lista de espera.",
  "features.kit.sample.3": "Cobra 1 € para validar la voluntad de pago.",

  "how.eyebrow": "Cómo funciona",
  "how.title.a": "Tres pasos. ",
  "how.title.b": "Noventa segundos.",
  "how.step1.title": "Describe tu idea",
  "how.step1.body": "Una frase o un párrafo. Cuanto más honesto seas, más afilado el roast.",
  "how.step2.title": "Hacemos la autopsia",
  "how.step2.body": "La IA cruza señales de mercado, competidores con nombre, timing y viabilidad.",
  "how.step3.title": "Recibe tu veredicto",
  "how.step3.body":
    "Lanzar, pivotar o matar — más un kit de supervivencia de 3 pasos para los próximos 7 días.",

  "sample.eyebrow": "Autopsia de ejemplo",
  "sample.title": "Esto es lo que te vas a llevar.",
  "sample.casefile": "EXPEDIENTE / 0001",
  "sample.verdictTag": "☠ MÁTALA",
  "sample.idea": '"Uber para paseadores de perros, pero solo los domingos, con NFTs."',
  "sample.roast.eyebrow": "El roast",
  "sample.roast.body":
    "Has combinado tres tendencias muertas en una. Rover ya domina el marketplace de paseadores, los domingos te recortan el TAM un 86 % y los NFTs son tan 2022 como puedan ser. Esto no es una startup, es un Madlibs de pitch decks de 2021.",
  "sample.tam.eyebrow": "TAM",
  "sample.tam.value": "~40M $",
  "sample.tam.note": "Cayendo 12 % anual. CAC brutal.",
  "sample.cta": "Roastea mi idea mejor",

  "faq.eyebrow": "FAQ",
  "faq.title": "Preguntas & respuestas.",
  "faq.q1": "¿Esto es solo una IA diciendo cosas feas?",
  "faq.a1":
    "No. Cruza competidores reales, dirección del mercado, timing y riesgo de ejecución — y lo convierte en un roast específico y afilado. El objetivo es ahorrarte 6 meses construyendo lo que no toca.",
  "faq.q2": "¿Va a matar todas las ideas?",
  "faq.a2":
    'No. Las ideas fuertes reciben un veredicto "lanza" con los 3 siguientes pasos de validación. Las flojas reciben un "mata" con 3 pivotes. La mayoría caen en "pivota".',
  "faq.q3": "¿Guardáis mi idea?",
  "faq.a3":
    "Sin cuenta, sin base de datos. Tu idea se envía a la IA para analizarla y ya está — el resultado vive en tu sesión del navegador.",
  "faq.q4": "¿En qué se diferencia de ChatGPT?",
  "faq.a4":
    "El ChatGPT genérico evita comprometerse, te halaga y te devuelve un DAFO ordenadito. Kill My Idea tiene opinión, estructura, y está hecho para ser brutalmente honesto.",

  "finalcta.title.a": "Deja de adivinar.",
  "finalcta.title.b": "Recibe la autopsia.",
  "finalcta.body": "90 segundos para saber si estás construyendo un unicornio o un side project.",
  "finalcta.button": "Mata mi idea",

  "footer.tag": "Hecho con honestidad brutal.",

  "kill.back": "← Volver al inicio",
  "kill.title.a": "Describe tu",
  "kill.title.b": "idea de startup.",
  "kill.subtitle": "Sé específico. Cuanto más afilado tu pitch, más afilado el roast.",
  "kill.placeholder.1": "Un competidor de Notion centrado en asesores fiscales…",
  "kill.placeholder.2": "Uber para paseadores de perros, solo domingos…",
  "kill.placeholder.3": "Un agente de IA que responde a mis matches de Hinge…",
  "kill.placeholder.4": "Un SaaS que resume hilos de Slack en correos…",
  "kill.kbdHint": "para enviar",
  "kill.submit": "Lanzar la autopsia",
  "kill.tryThese": "O prueba una de estas",
  "kill.advanced.toggle": "Añadir contexto o mercado objetivo",
  "kill.advanced.marketLabel": "Mercado objetivo",
  "kill.advanced.marketPlaceholder": "ej. solo España, LATAM, pymes UE, solo Japón…",
  "kill.advanced.marketHint":
    "Centraremos TAM/SAM/SOM, competidores, regulación y canales en esa geografía.",
  "kill.advanced.contextLabel": "Contexto extra o réplica",
  "kill.advanced.contextPlaceholder":
    "Añade lo que la IA deba saber: tracción, por qué un roast anterior se equivoca, restricciones, perfil del fundador…",
  "kill.advanced.contextHint": "Rebate suposiciones. La IA lo tendrá en cuenta antes de puntuar.",
  "kill.loading.1": "Leyendo tu pitch en voz alta…",
  "kill.loading.2": "Contando tus competidores…",
  "kill.loading.3": "Buscando los 47 clones muertos…",
  "kill.loading.4": "Preguntando a VCs por qué pasarían…",
  "kill.loading.5": "Estimando el TAM honestamente…",
  "kill.loading.6": "Revisando el cementerio del timing…",
  "kill.loading.7": "Afilando el cuchillo…",
  "kill.loading.note":
    "Cruzando señales de mercado, competidores y timing. Normalmente 60–90 segundos.",

  "autopsy.eyebrow": "Expediente",
  "autopsy.title": "Informe de autopsia",
  "autopsy.share": "Compartir",
  "autopsy.share.full": "Compartir informe completo",
  "autopsy.share.label": "Copia o descarga la autopsia entera",
  "autopsy.share.markdown": "Copiar informe completo (Markdown)",
  "autopsy.share.markdown.hint": "Pega en Notion, Slack, GitHub o un doc.",
  "autopsy.share.ai": "Copiar como briefing para IA",
  "autopsy.share.ai.hint": "Pega en ChatGPT, Claude o Gemini y sigue iterando.",
  "autopsy.share.json": "Copiar como JSON",
  "autopsy.share.json.hint": "Para scripts, automatizaciones o tu propio dashboard.",
  "autopsy.share.short": "Copiar resumen corto",
  "autopsy.share.short.hint": "Versión de un párrafo para tweets o DMs.",
  "autopsy.share.download.md": "Descargar archivo .md",
  "autopsy.share.download.json": "Descargar archivo .json",
  "autopsy.copied": "✓ Copiado",
  "autopsy.newIdea": "Nueva idea",
  "autopsy.submitted": "Idea enviada",
  "autopsy.roast": "El roast",
  "autopsy.verdict": "Veredicto",
  "autopsy.overall": "Global",
  "autopsy.signal.strong": "Señal fuerte",
  "autopsy.signal.mixed": "Señal mixta",
  "autopsy.signal.weak": "Señal débil",
  "autopsy.scores": "Desglose por métrica",
  "autopsy.market": "Investigación de mercado",
  "autopsy.market.tam": "TAM",
  "autopsy.market.sam": "SAM",
  "autopsy.market.som": "SOM (realista Y1)",
  "autopsy.market.growth": "Señal de crecimiento",
  "autopsy.market.maturity": "Madurez del mercado",
  "autopsy.market.customer": "Cliente objetivo",
  "autopsy.market.geographies": "Top geografías",
  "autopsy.market.trends": "Tendencias macro",
  "autopsy.market.competitors": "Competidores",
  "autopsy.market.redflags": "⚠ Red flags",
  "autopsy.kit.pivot": "Direcciones de pivote",
  "autopsy.kit.survival": "Kit de supervivencia · próximos 7 días",
  "autopsy.cta": "Matar otra idea",
  "autopsy.category": "Categoría",
  "autopsy.quote": "Quote",
  "autopsy.verdict.summary": "Por qué este veredicto",
  "autopsy.personas": "Personas ICP",
  "autopsy.persona.who": "Quién",
  "autopsy.persona.pain": "Dolor",
  "autopsy.persona.wtp": "Disposición a pagar",
  "autopsy.persona.find": "Dónde encontrarlos",
  "autopsy.competitors": "Mapa de competidores",
  "autopsy.competitors.threat": "Amenaza",
  "autopsy.bigtech": "Amenazas big-tech",
  "autopsy.bigtech.likelihood": "Probabilidad",
  "autopsy.bigtech.timeline": "Plazo",
  "autopsy.dead": "Clones muertos",
  "autopsy.dead.cause": "Causa de muerte",
  "autopsy.model": "Modelo de negocio",
  "autopsy.model.revenue": "Fuentes de ingreso",
  "autopsy.model.pricing": "Pricing sugerido",
  "autopsy.model.unit": "Unit economics",
  "autopsy.model.cac": "CAC",
  "autopsy.model.ltv": "LTV",
  "autopsy.model.margin": "Margen bruto",
  "autopsy.model.payback": "Payback",
  "autopsy.gtm": "Go-to-market",
  "autopsy.gtm.wedge": "El wedge",
  "autopsy.gtm.channels": "Canales",
  "autopsy.gtm.first100": "Primeros 100 usuarios",
  "autopsy.gtm.content": "Ángulos de contenido",
  "autopsy.stack": "Stack técnico recomendado",
  "autopsy.stack.frontend": "Frontend",
  "autopsy.stack.backend": "Backend",
  "autopsy.stack.db": "Base de datos",
  "autopsy.stack.ai": "IA",
  "autopsy.stack.infra": "Infra",
  "autopsy.stack.integrations": "Integraciones",
  "autopsy.stack.build": "Tiempo al MVP",
  "autopsy.prompt": "Prompt para el MVP",
  "autopsy.prompt.note": "Pega esto en Lovable, Cursor o v0 para arrancar el MVP.",
  "autopsy.prompt.copy": "Copiar prompt",
  "autopsy.prompt.copied": "✓ Copiado",
  "autopsy.roadmap": "Roadmap",
  "autopsy.roadmap.w1": "Semana 1",
  "autopsy.roadmap.m1": "Mes 1",
  "autopsy.roadmap.m3": "Mes 3",
  "autopsy.roadmap.m6": "Mes 6",
  "autopsy.roadmap.y1": "Año 1",
  "autopsy.risks": "Riesgos y mitigaciones",
  "autopsy.killswitches": "Kill switches",
  "autopsy.names": "Nombres de marca",
  "autopsy.effort": "Esfuerzo",

  "verdict.ship.label": "LANZA",
  "verdict.ship.tag": "Esta podría funcionar. Mueve rápido.",
  "verdict.pivot.label": "PIVOTA ANTES",
  "verdict.pivot.tag": "Hay algo aquí. Pero no en esta forma.",
  "verdict.kill.label": "MÁTALA",
  "verdict.kill.tag": "Salva tus fines de semana. Prueba otra cosa.",
};

const DICTS: Record<Lang, Dict> = { en, es };

export type TKey = keyof Dict;

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "es") return stored;
  } catch {
    // ignore
  }
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("es") ? "es" : "en";
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  // Render with "en" on server / first client paint to avoid hydration mismatch,
  // then swap to detected language on mount.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        try {
          window.localStorage.setItem(STORAGE_KEY, l);
        } catch {
          // ignore
        }
      },
      t: (key) => DICTS[lang][key] ?? DICTS.en[key] ?? key,
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Safe fallback so isolated component renders don't crash.
    return {
      lang: "en",
      setLang: () => {},
      t: (key) => DICTS.en[key] ?? key,
    };
  }
  return ctx;
}
