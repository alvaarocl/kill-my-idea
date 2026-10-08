import { existsSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

const REQUIRED_VITE_ENV = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_PAYMENTS_CLIENT_TOKEN",
] as const;

/**
 * Validates required VITE_* env vars at build time.
 * - Local builds (no CI env): hard error — forces devs to set up .env.
 * - CI builds (CI=true): warning only — vars come from the deployment
 *   platform's secret store, not from .env. The runtime checks in
 *   client.ts and paddle.ts will catch any missing config at startup.
 */
function validateEnv(): Plugin {
  return {
    name: "validate-required-env",
    apply: "build",
    configResolved(config) {
      const missing = REQUIRED_VITE_ENV.filter((k) => !config.env[k]);
      if (missing.length === 0) return;
      const msg = `Missing required environment variables:\n  ${missing.join("\n  ")}\nAdd them to .env (local) or your CI/Worker secrets (production).`;
      if (process.env.CI) {
        // In CI, warn but don't block — platform injects vars at deploy time.
        console.warn(`[validate-env] WARNING: ${msg}`);
      } else {
        throw new Error(`Build error: ${msg}`);
      }
    },
  };
}

/**
 * Production prompts live in src/lib/prompts/private.ts, which is git-ignored.
 * A production build without it would silently ship the generic example prompts,
 * so it fails unless ALLOW_EXAMPLE_PROMPTS=1 (for forks and CI).
 */
function requirePrivatePrompts(): Plugin {
  return {
    name: "require-private-prompts",
    apply: "build",
    configResolved(config) {
      if (config.mode !== "production" || process.env.ALLOW_EXAMPLE_PROMPTS === "1") return;
      if (!existsSync(`${config.root}/src/lib/prompts/private.ts`)) {
        throw new Error(
          "Build error: src/lib/prompts/private.ts is missing, so the build would use the example prompts. " +
            "Add it, or set ALLOW_EXAMPLE_PROMPTS=1 if that is intended.",
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    validateEnv(),
    requirePrivatePrompts(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    react(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
  ],
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
});
