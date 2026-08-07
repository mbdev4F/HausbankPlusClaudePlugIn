import {
  entraAuthority,
  entraClientId,
  entraClientSecret,
  entraScopes,
  oauthCallbackUrl,
} from "./config";
import { decodeJwtPayload } from "./jwt";

export function buildEntraAuthorizeUrl(args: {
  state: string;
  codeChallenge: string;
}): string {
  const u = new URL(`${entraAuthority()}/oauth2/v2.0/authorize`);
  u.searchParams.set("client_id", entraClientId());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", oauthCallbackUrl());
  u.searchParams.set("response_mode", "query");
  u.searchParams.set("scope", entraScopes());
  u.searchParams.set("state", args.state);
  u.searchParams.set("code_challenge", args.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export type EntraTokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export async function exchangeEntraCode(args: {
  code: string;
  codeVerifier: string;
}): Promise<EntraTokenResponse> {
  const body = new URLSearchParams({
    client_id: entraClientId(),
    client_secret: entraClientSecret(),
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: oauthCallbackUrl(),
    code_verifier: args.codeVerifier,
    scope: entraScopes(),
  });
  const res = await fetch(`${entraAuthority()}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Entra token exchange failed (HTTP ${res.status}): ${text.slice(0, 500)}`);
  }
  return JSON.parse(text) as EntraTokenResponse;
}

export async function refreshEntraToken(
  refreshToken: string,
): Promise<EntraTokenResponse> {
  const body = new URLSearchParams({
    client_id: entraClientId(),
    client_secret: entraClientSecret(),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: entraScopes(),
  });
  const res = await fetch(`${entraAuthority()}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Entra refresh failed (HTTP ${res.status}): ${text.slice(0, 500)}`);
  }
  return JSON.parse(text) as EntraTokenResponse;
}

export function tenantFromEntraTokens(tokens: EntraTokenResponse): {
  tenantId: string;
  oid?: string;
  name?: string;
} {
  const fromAccess = decodeJwtPayload(tokens.access_token);
  const fromId = tokens.id_token ? decodeJwtPayload(tokens.id_token) : null;
  const tid = String(
    fromAccess?.tid ?? fromId?.tid ?? fromAccess?.tenantId ?? "",
  );
  if (!tid) {
    throw new Error("Entra token missing tenant id (tid)");
  }
  return {
    tenantId: tid,
    oid: fromAccess?.oid ? String(fromAccess.oid) : fromId?.oid ? String(fromId.oid) : undefined,
    name: fromId?.name ? String(fromId.name) : undefined,
  };
}
