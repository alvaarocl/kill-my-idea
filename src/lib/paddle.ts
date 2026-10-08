import { resolvePaddlePrice } from "@/utils/payments.functions";

// VITE_PAYMENTS_CLIENT_TOKEN must be set in your .env (test_* for sandbox, live_* for production)
const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

declare global {
  interface Window {
    Paddle: {
      Environment: { set: (env: "sandbox" | "production") => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: { open: (opts: Record<string, unknown>) => void };
    };
  }
}

export function getPaddleEnvironment(): "sandbox" | "live" {
  if (!clientToken) throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not configured");
  return clientToken.startsWith("test_") ? "sandbox" : "live";
}

let paddleInitialized = false;
let paddleInitializing: Promise<void> | null = null;

export async function initializePaddle(): Promise<void> {
  if (paddleInitialized) return;
  if (paddleInitializing) return paddleInitializing;

  if (!clientToken) {
    throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");
  }

  paddleInitializing = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://cdn.paddle.com/paddle/v2/paddle.js"]',
    );
    const onReady = () => {
      try {
        const paddleJsEnv = getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
        window.Paddle.Environment.set(paddleJsEnv);
        window.Paddle.Initialize({ token: clientToken });
        paddleInitialized = true;
        resolve();
      } catch (e) {
        reject(e);
      }
    };

    if (existing && window.Paddle) {
      onReady();
      return;
    }
    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => reject(new Error("Paddle.js failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = onReady;
    script.onerror = () => reject(new Error("Paddle.js failed to load"));
    document.head.appendChild(script);
  });

  return paddleInitializing;
}

export async function getPaddlePriceId(priceId: string): Promise<string> {
  const environment = getPaddleEnvironment();
  return resolvePaddlePrice({ data: { priceId, environment } });
}
