import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPaths({ projects: ["./tsconfig.json"] })],
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
  },
  test: {
    environment: "node",
    globals: true,
  },
});
