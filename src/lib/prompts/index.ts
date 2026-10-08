import type { PromptPack } from "./types";
import example from "./example";

// ./private.ts holds the production prompts and is git-ignored. When it is missing
// (a fresh clone), the generic ./example.ts is used. vite.config.ts refuses a
// production build without it, so the live site never ships the example by accident.
const privatePack = Object.values(
  import.meta.glob<{ default: PromptPack }>("./private.ts", { eager: true }),
)[0]?.default;

export const prompts: PromptPack = privatePack ?? example;
