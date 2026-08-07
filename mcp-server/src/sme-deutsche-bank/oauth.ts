import { randomUUID } from "node:crypto";
import {
  buildSmeDbAuthorizeUrl,
  type SmeDbTokenResponse,
} from "./shared.js";
import {
  smeDbGetResolvedCredentials,
  validateSmeDbClientCredentials,
  validateSmeDbUserSession,
  type SmeDbResolvedCredentials,
} from "./resolved-credentials.js";
import { smeDbOAuthCallbackPath } from "./env-config.js";

export class SmeDbApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string
  ) {
    super(message);
    this.name = "SmeDbApiError";
  }
}

export function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;
}

/** Request-scoped only; not persisted. Prefer BizBankingConnect for Claude OAuth. */
const tokenCacheState: { token: string; expiresAt: number } = {
  token: "",
  expiresAt: 0,
};

export function clearSmeDbTokenCache(): void {
  tokenCacheState.token = "";
  tokenCacheState.expiresAt = 0;
}

export function randomOAuthState(): string {
  return randomUUID().replace(/[{}-]/g, "");
}

export type SmeDbAuthorizeProbeResult =
  | { ok: true }
  | { ok: false; code: string; detail: string };

export async function probeSmeDbAuthorizeReachability(
  authorizeUrl: string
): Promise<SmeDbAuthorizeProbeResult> {
  let res: Response;
  try {
    res = await fetch(authorizeUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Netzwerkfehler";
    return { ok: false, code: "db_authorize_unreachable", detail: msg };
  }

  const text = (await res.text()).trim();

  if (text.includes("Not able to fetch ACR value")) {
    const isLive = authorizeUrl.includes("api.db.com/gw/oidc");
    return {
      ok: false,
      code: "db_acr_not_configured",
      detail: isLive
        ? "Die Client-ID ist für Live (api.db.com) nicht freigeschaltet — Production-Zugang beantragen oder Simulator-URLs nutzen."
        : "Die Deutsche Bank konnte keinen ACR-Wert für diese Client-ID laden — App-Konfiguration prüfen.",
    };
  }

  if (res.status === 404) {
    return {
      ok: false,
      code: "db_authorize_not_found",
      detail:
        "Authorization-Endpunkt antwortet mit 404 — Simulator ggf. nicht verfügbar; Live-Defaults prüfen.",
    };
  }

  if (res.status >= 300 && res.status < 400) return { ok: true };
  if (res.status >= 200 && res.status < 300 && !text.startsWith("<root>")) {
    return { ok: true };
  }

  if (res.status >= 400 || text.startsWith("<root>")) {
    const snippet = text.replace(/\s+/g, " ").slice(0, 180);
    return {
      ok: false,
      code: "db_authorize_error",
      detail: snippet || `HTTP ${res.status}`,
    };
  }

  return { ok: true };
}

function resolveRedirectUri(
  creds: SmeDbResolvedCredentials,
  redirectUri?: string
): string {
  if (redirectUri?.trim()) return redirectUri.trim();
  if (creds.publicOrigin) {
    return `${creds.publicOrigin}${smeDbOAuthCallbackPath()}`;
  }
  throw new Error(
    "redirectUri fehlt — explizit übergeben oder SME_DB_PUBLIC_ORIGIN setzen."
  );
}

export async function exchangeSmeDbAuthorizationCode(
  code: string,
  redirectUri?: string
): Promise<SmeDbTokenResponse> {
  const creds = smeDbGetResolvedCredentials();
  const err = validateSmeDbClientCredentials(creds);
  if (err) throw new Error(err);
  const uri = resolveRedirectUri(creds, redirectUri);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: uri,
  });

  const res = await fetch(creds.endpoints.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(creds.clientId, creds.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `Token-Austausch fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text.slice(0, 800)
    );
  }

  let json: SmeDbTokenResponse;
  try {
    json = JSON.parse(text) as SmeDbTokenResponse;
  } catch {
    throw new Error("Token-Antwort ist kein gültiges JSON.");
  }
  if (!json.access_token) {
    throw new Error("access_token fehlt in der Token-Antwort.");
  }

  const expiresIn =
    typeof json.expires_in === "number" && json.expires_in > 0
      ? json.expires_in
      : 600;
  tokenCacheState.token = json.access_token;
  tokenCacheState.expiresAt = Date.now() + expiresIn * 1000 - 30_000;

  return json;
}

export async function getSmeDbAccessToken(redirectUri?: string): Promise<string> {
  if (tokenCacheState.token && tokenCacheState.expiresAt > Date.now()) {
    return tokenCacheState.token;
  }

  const creds = smeDbGetResolvedCredentials();
  const err = validateSmeDbUserSession(creds);
  if (err) throw new Error(err);
  const uri = resolveRedirectUri(creds, redirectUri);

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: creds.refreshToken,
    redirect_uri: uri,
  });

  const res = await fetch(creds.endpoints.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(creds.clientId, creds.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `Refresh-Token fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text.slice(0, 800)
    );
  }

  let json: SmeDbTokenResponse;
  try {
    json = JSON.parse(text) as SmeDbTokenResponse;
  } catch {
    throw new Error("Token-Antwort ist kein gültiges JSON.");
  }
  if (!json.access_token) {
    throw new Error("access_token fehlt in der Refresh-Antwort.");
  }

  const expiresIn =
    typeof json.expires_in === "number" && json.expires_in > 0
      ? json.expires_in
      : 600;
  tokenCacheState.token = json.access_token;
  tokenCacheState.expiresAt = Date.now() + expiresIn * 1000 - 30_000;

  return json.access_token;
}

export function buildSmeDbOAuthStart(params?: {
  redirectUri?: string;
  state?: string;
}): {
  authorizeUrl: string;
  redirectUri: string;
  state: string;
  probe: SmeDbAuthorizeProbeResult | null;
} {
  const creds = smeDbGetResolvedCredentials();
  const err = validateSmeDbClientCredentials(creds);
  if (err) throw new Error(err);

  const redirectUri = resolveRedirectUri(creds, params?.redirectUri);
  const state = params?.state?.trim() || randomOAuthState();
  const authorizeUrl = buildSmeDbAuthorizeUrl(creds.endpoints.authUrl, {
    redirectUri,
    clientId: creds.clientId,
    state,
    scope: creds.endpoints.scope,
  });

  return { authorizeUrl, redirectUri, state, probe: null };
}
