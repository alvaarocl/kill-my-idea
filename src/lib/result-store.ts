import type { KillResult } from "./analyze.functions";

const KEY = "kmi:last-result";

export type StoredResult = {
  idea: string;
  result: KillResult;
  at: number;
  locked?: boolean;
  analysisId?: string;
  mode?: "demo" | "personal";
};

export function saveResult(payload: StoredResult) {
  if (typeof window === "undefined") return;
  // Personal-mode results are persisted in the DB — only keep in sessionStorage
  // long enough to navigate to /autopsy, then let the DB be the source of truth.
  // Demo results have no DB record so sessionStorage is their only store.
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadResult(): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredResult;
  } catch {
    return null;
  }
}

export function clearResult() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
