/**
 * finAPI Mandator credentials from server env.
 * Client secret is required for the MCP process (no team store / Key Vault UI).
 */

import {
  finapiEndpointsForEnvironment,
  type FinapiEnvironment,
  type FinapiEndpoints,
} from "./shared";

export type FinapiEnvCredentials = {
  clientId: string;
  clientSecret: string;
  environment: FinapiEnvironment;
  userId: string;
  userPassword: string;
  publicOrigin: string | null;
  endpoints: FinapiEndpoints;
};

function env(key: string): string {
  const direct = (process.env[key] ?? "").trim();
  if (direct) return direct;
  for (const [k, v] of Object.entries(process.env)) {
    if (k.trim() === key && typeof v === "string") return v.trim();
  }
  return "";
}

export function readFinapiEnvironment(): FinapiEnvironment {
  const raw = env("FINAPI_ENVIRONMENT").toLowerCase();
  return raw === "live" ? "live" : "sandbox";
}

/** Öffentliche HTTPS-Origin für finAPI-Callbacks (ngrok, Vercel, …). */
export function readFinapiPublicOrigin(): string | null {
  const candidates = [
    process.env.FINAPI_PUBLIC_ORIGIN,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);

  for (const raw of candidates) {
    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      if (url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      /* next */
    }
  }
  return null;
}

export function readFinapiEnv(): FinapiEnvCredentials {
  const environment = readFinapiEnvironment();
  return {
    clientId:
      env("FINAPI_CLIENT_ID") ||
      env("FINAPI_ACCESS_CLIENT_ID") ||
      env("FinapiClientId"),
    clientSecret:
      env("FINAPI_CLIENT_SECRET") ||
      env("FINAPI_ACCESS_CLIENT_SECRET") ||
      env("FinapiClientSecret"),
    environment,
    userId: env("FINAPI_USER_ID"),
    userPassword: env("FINAPI_USER_PASSWORD"),
    publicOrigin: readFinapiPublicOrigin(),
    endpoints: finapiEndpointsForEnvironment(environment),
  };
}

export function hasFinapiEnv(): boolean {
  const e = readFinapiEnv();
  return Boolean(e.clientId || e.clientSecret);
}
