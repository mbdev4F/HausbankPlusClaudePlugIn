/**
 * SME Deutsche Bank Connector — credentials from server env (no team store).
 */

import {
  smeDbEndpointsForEnvironment,
  type SmeDbEndpoints,
  type SmeDbEnvironment,
} from "./shared.js";

export type SmeDbEnvCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  environment: SmeDbEnvironment;
  publicOrigin: string | null;
  endpoints: SmeDbEndpoints;
};

function env(key: string): string {
  const direct = (process.env[key] ?? "").trim();
  if (direct) return direct;
  for (const [k, v] of Object.entries(process.env)) {
    if (k.trim() === key && typeof v === "string") return v.trim();
  }
  return "";
}

export function readSmeDbEnvironment(): SmeDbEnvironment {
  const raw = (env("SME_DB_ENVIRONMENT") || env("DEUTSCHE_BANK_BIZ_ENVIRONMENT")).toLowerCase();
  return raw === "live" ? "live" : "sandbox";
}

export function readSmeDbPublicOrigin(): string | null {
  const candidates = [
    env("SME_DB_PUBLIC_ORIGIN"),
    env("DEUTSCHE_BANK_BIZ_PUBLIC_ORIGIN"),
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ].filter(Boolean);

  for (const raw of candidates) {
    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      if (url.protocol === "https:" || url.hostname === "localhost") {
        return url.origin;
      }
    } catch {
      /* next */
    }
  }
  return null;
}

export function readSmeDbEnv(): SmeDbEnvCredentials {
  const environment = readSmeDbEnvironment();
  return {
    clientId:
      env("SME_DB_CLIENT_ID") ||
      env("CASH365_BIZBANK_CLIENT_ID") ||
      env("CASH365_BIZ_BANK_CLIENT_ID") ||
      env("Cash365BizBankClientId") ||
      env("DEUTSCHE_BANK_BIZ_CLIENT_ID"),
    clientSecret:
      env("SME_DB_CLIENT_SECRET") ||
      env("CASH365_BIZBANK_CLIENT_SECRET") ||
      env("Cash365BizBankClientSecret") ||
      env("DEUTSCHE_BANK_BIZ_CLIENT_SECRET"),
    refreshToken:
      env("SME_DB_REFRESH_TOKEN") ||
      env("DEUTSCHE_BANK_BIZ_REFRESH_TOKEN"),
    environment,
    publicOrigin: readSmeDbPublicOrigin(),
    endpoints: smeDbEndpointsForEnvironment(environment),
  };
}

export function hasSmeDbEnv(): boolean {
  const e = readSmeDbEnv();
  return Boolean(e.clientId || e.clientSecret || e.refreshToken);
}

export function smeDbOAuthCallbackPath(): string {
  return "/api/sme-db-oauth/callback";
}
