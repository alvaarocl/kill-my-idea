import { Environment, Paddle, EventName } from "@paddle/paddle-node-sdk";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

const getAnyEnv = (keys: string[]): string => {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  throw new Error(`${keys.join(" or ")} is not configured`);
};

export { EventName };

export type PaddleEnv = "sandbox" | "live";

export function getConnectionApiKey(env: PaddleEnv): string {
  return env === "sandbox" ? getEnv("PADDLE_SANDBOX_API_KEY") : getEnv("PADDLE_LIVE_API_KEY");
}

export function getPaddleClient(env: PaddleEnv): Paddle {
  const apiKey = getConnectionApiKey(env);
  return new Paddle(apiKey, {
    environment: env === "sandbox" ? Environment.sandbox : Environment.production,
  });
}

export function getWebhookSecret(env: PaddleEnv): string {
  return env === "sandbox"
    ? getAnyEnv(["PAYMENTS_SANDBOX_WEBHOOK_SECRET", "PADDLE_SANDBOX_WEBHOOK_SECRET"])
    : getAnyEnv(["PAYMENTS_LIVE_WEBHOOK_SECRET", "PADDLE_LIVE_WEBHOOK_SECRET"]);
}

export function getServerPaddleEnv(): PaddleEnv {
  const explicitEnv = process.env.PAYMENTS_ENV;
  if (explicitEnv === "sandbox" || explicitEnv === "live") return explicitEnv;
  if (explicitEnv) throw new Error("PAYMENTS_ENV must be either sandbox or live");

  const clientToken = process.env.VITE_PAYMENTS_CLIENT_TOKEN ?? "";
  if (!clientToken) {
    throw new Error(
      "VITE_PAYMENTS_CLIENT_TOKEN or PAYMENTS_ENV is required to resolve Paddle environment",
    );
  }
  return clientToken.startsWith("test_") ? "sandbox" : "live";
}

export async function verifyWebhook(req: Request, env: PaddleEnv) {
  const signature = req.headers.get("paddle-signature");
  const body = await req.text();
  const secret = getWebhookSecret(env);

  if (!signature || !body) {
    throw new Error("Missing signature or body");
  }

  const paddle = getPaddleClient(env);
  return await paddle.webhooks.unmarshal(body, secret, signature);
}
