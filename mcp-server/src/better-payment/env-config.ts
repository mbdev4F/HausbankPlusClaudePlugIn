/**
 * Better Payment — credentials from server env (no team store).
 */

import {
  betterPaymentBaseUrlForEnvironment,
  type BetterPaymentEnvironment,
} from "./shared.js";

export type BetterPaymentEnvCredentials = {
  apiKey: string;
  outgoingKey: string;
  incomingKey: string;
  environment: BetterPaymentEnvironment;
  apiBaseUrl: string;
  publicOrigin: string | null;
};

function env(key: string): string {
  const direct = (process.env[key] ?? "").trim();
  if (direct) return direct;
  for (const [k, v] of Object.entries(process.env)) {
    if (k.trim() === key && typeof v === "string") return v.trim();
  }
  return "";
}

export function readBetterPaymentEnvironment(): BetterPaymentEnvironment {
  const raw = env("BETTER_PAYMENT_ENVIRONMENT").toLowerCase();
  return raw === "live" ? "live" : "sandbox";
}

/**
 * Öffentliche HTTPS-Origin für success/error/postback/wero_checkout_url.
 * Better Payment lehnt http:// ab (error_code 149).
 */
export function readBetterPaymentPublicOrigin(): string | null {
  const candidates = [
    env("BETTER_PAYMENT_PUBLIC_ORIGIN"),
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ].filter(Boolean);

  for (const raw of candidates) {
    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      if (url.protocol === "https:") return url.origin;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Erzwingt https:// — für Sandbox-Tests ohne Tunnel (localhost → https://localhost). */
export function ensureHttpsOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    url.protocol = "https:";
    return url.origin;
  } catch {
    return "https://localhost";
  }
}

export function readBetterPaymentEnv(): BetterPaymentEnvCredentials {
  const environment = readBetterPaymentEnvironment();
  const override = env("BETTER_PAYMENT_API_BASE");
  return {
    apiKey: env("BETTER_PAYMENT_API_KEY"),
    outgoingKey: env("BETTER_PAYMENT_OUTGOING_KEY"),
    incomingKey: env("BETTER_PAYMENT_INCOMING_KEY"),
    environment,
    apiBaseUrl: override || betterPaymentBaseUrlForEnvironment(environment),
    publicOrigin: readBetterPaymentPublicOrigin(),
  };
}

export function hasBetterPaymentEnv(): boolean {
  const e = readBetterPaymentEnv();
  return Boolean(e.apiKey || e.outgoingKey || e.incomingKey);
}
