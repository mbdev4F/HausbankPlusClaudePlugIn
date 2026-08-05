/**
 * Lightweight OData client for Hausbank-Agent CloudConnector APIs.
 * Prefers OAuth user session (Entra); falls back to env client_credentials.
 */

import {
  banqrBcApiRoot,
  readBanqrBcEnv,
  type BanqrBcEnv,
} from "./env-config";
import { getHausbankSession } from "../oauth/session";

type CachedToken = { accessToken: string; expiresAtMs: number; key: string };

let cached: CachedToken | null = null;
const SKEW_MS = 90_000;

export class BanqrBcHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = "BanqrBcHttpError";
  }
}

async function fetchAccessToken(e: BanqrBcEnv): Promise<{
  accessToken: string;
  expiresInSec: number;
}> {
  const url = `${e.loginBaseUrl}/${e.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: e.oauthScope,
    client_id: e.clientId,
    client_secret: e.clientSecret,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new BanqrBcHttpError(
      `Hausbank-Agent token failed (HTTP ${res.status}): ${text.slice(0, 400)}`,
      res.status,
      text,
    );
  }
  const json = JSON.parse(text) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    throw new Error("Hausbank-Agent token response missing access_token");
  }
  return {
    accessToken: json.access_token,
    expiresInSec:
      typeof json.expires_in === "number" ? json.expires_in : 3600,
  };
}

export async function getBanqrBcAccessToken(
  e: BanqrBcEnv = readBanqrBcEnv(),
): Promise<string> {
  const session = getHausbankSession();
  if (session?.accessToken) return session.accessToken;

  const key = `${e.tenantId}:${e.clientId}`;
  const now = Date.now();
  if (cached && cached.key === key && now < cached.expiresAtMs - SKEW_MS) {
    return cached.accessToken;
  }
  const { accessToken, expiresInSec } = await fetchAccessToken(e);
  cached = {
    accessToken,
    expiresAtMs: now + expiresInSec * 1000,
    key,
  };
  return accessToken;
}

/** Effective env: OAuth session overrides tenant/environment/company. */
export function effectiveBanqrBcEnv(
  e: BanqrBcEnv = readBanqrBcEnv(),
): BanqrBcEnv {
  const session = getHausbankSession();
  if (!session) return e;
  return {
    ...e,
    tenantId: session.tenantId || e.tenantId,
    environmentName: session.environmentName || e.environmentName,
    companyId: session.companyId || e.companyId,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type BanqrBcRequestOptions = {
  method?: string;
  path: string;
  query?: string;
  body?: unknown;
  ifMatch?: string;
  companyId?: string;
  timeoutMs?: number;
};

function resolveCompanyId(e: BanqrBcEnv, override?: string): string {
  const id = (override ?? e.companyId).trim();
  if (!id) {
    throw new Error(
      "companyId fehlt — beim OAuth-Connect angeben oder companyId / hausbank_agent_list_companies nutzen.",
    );
  }
  return id;
}

/** Replace `{companyId}` placeholder or leave path as-is. */
export function withCompany(path: string, companyId: string): string {
  return path
    .replaceAll("{companyId}", companyId)
    .replaceAll("{{companyId}}", companyId);
}

export async function banqrBcRequest<T = unknown>(
  opts: BanqrBcRequestOptions,
  e: BanqrBcEnv = readBanqrBcEnv(),
): Promise<{ status: number; data: T; etag?: string }> {
  const env = effectiveBanqrBcEnv(e);
  const token = await getBanqrBcAccessToken(env);
  const method = (opts.method ?? "GET").toUpperCase();
  let path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;

  if (path.includes("{companyId}") || path.includes("{{companyId}}")) {
    path = withCompany(path, resolveCompanyId(env, opts.companyId));
  }

  const qs = opts.query?.replace(/^\?/, "") ?? "";
  const url = `${banqrBcApiRoot(env)}${path}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (opts.ifMatch) {
    headers["If-Match"] = opts.ifMatch;
  }

  const timeoutMs = opts.timeoutMs ?? 120_000;
  let attempt = 0;
  while (true) {
    const res = await fetch(url, {
      method,
      headers,
      body:
        opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    if (res.status === 429 && attempt < 4) {
      const retryAfter = parseInt(res.headers.get("retry-after") ?? "", 10);
      await sleep(
        (Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : 1500) *
          (attempt + 1),
      );
      attempt++;
      continue;
    }
    if (!res.ok) {
      let message = text.slice(0, 800);
      try {
        const j = JSON.parse(text) as {
          error?: { message?: string; code?: string };
        };
        if (j.error?.message) {
          message = `${j.error.code ? j.error.code + ": " : ""}${j.error.message}`;
        }
      } catch {
        /* plain */
      }
      throw new BanqrBcHttpError(
        `Hausbank-Agent ${method} ${path} failed (HTTP ${res.status}): ${message}`,
        res.status,
        text,
      );
    }
    const etag = res.headers.get("etag") ?? undefined;
    if (!text) {
      return { status: res.status, data: null as T, etag };
    }
    try {
      return { status: res.status, data: JSON.parse(text) as T, etag };
    } catch {
      return { status: res.status, data: text as T, etag };
    }
  }
}
