export type PromptInput = {
  lang: "en" | "es";
  idea: string;
  market?: string;
  context?: string;
};

export type PromptPack = {
  /** JSON Schema of the `submit_analysis` tool. Its keys must match `KillResult`. */
  analysisJsonSchema: Record<string, unknown>;
  build: (input: PromptInput) => { system: string; user: string };
};
