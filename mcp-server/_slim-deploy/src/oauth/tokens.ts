import { oauthSigningSecret } from "./config";
import { signJwt, verifyJwt } from "./jwt";
import type { HausbankSession } from "./session";

/** Pending Claude→Entra authorize state (short-lived). */
export type OAuthPendingState = {
  typ: "pending";
  redirectUri: string;
  clientId: string;
  codeChallenge: string;
  claudeState: string;
  /** Our PKCE verifier for Entra (Claude's PKCE is separate). */
  entraCodeVerifier: string;
  environmentName: string;
  companyId: string;
};

/** Self-contained auth code returned to Claude. */
export type OAuthAuthCode = {
  typ: "code";
  redirectUri: string;
  clientId: string;
  codeChallenge: string;
  accessToken: string;
  refreshToken?: string;
  tenantId: string;
  environmentName: string;
  companyId: string;
  oid?: string;
  name?: string;
  expiresIn?: number;
};

/** Access token Claude sends to MCP. */
export type OAuthSessionToken = {
  typ: "session";
  accessToken: string;
  refreshToken?: string;
  tenantId: string;
  environmentName: string;
  companyId: string;
  oid?: string;
  name?: string;
};

export function mintPendingState(payload: Omit<OAuthPendingState, "typ">): string {
  return signJwt({ ...payload, typ: "pending" }, oauthSigningSecret(), 600);
}

export function readPendingState(token: string): OAuthPendingState {
  const p = verifyJwt<OAuthPendingState>(token, oauthSigningSecret());
  if (p.typ !== "pending") throw new Error("Invalid pending state");
  return p;
}

export function mintAuthCode(payload: Omit<OAuthAuthCode, "typ">): string {
  return signJwt({ ...payload, typ: "code" }, oauthSigningSecret(), 300);
}

export function readAuthCode(token: string): OAuthAuthCode {
  const p = verifyJwt<OAuthAuthCode>(token, oauthSigningSecret());
  if (p.typ !== "code") throw new Error("Invalid auth code");
  return p;
}

export function mintSessionToken(
  payload: Omit<OAuthSessionToken, "typ">,
  expiresInSec = 3500,
): string {
  return signJwt({ ...payload, typ: "session" }, oauthSigningSecret(), expiresInSec);
}

export function readSessionToken(token: string): OAuthSessionToken {
  const p = verifyJwt<OAuthSessionToken>(token, oauthSigningSecret());
  if (p.typ !== "session") throw new Error("Invalid session token");
  return p;
}

export function sessionFromToken(tok: OAuthSessionToken): HausbankSession {
  return {
    accessToken: tok.accessToken,
    tenantId: tok.tenantId,
    environmentName: tok.environmentName,
    companyId: tok.companyId,
    oid: tok.oid,
    name: tok.name,
  };
}
