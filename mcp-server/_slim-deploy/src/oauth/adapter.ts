import { randomBytes } from "crypto";
import {
  mcpResourceUrl,
  oauthCallbackUrl,
  oauthEnabled,
  oauthPublicOrigin,
} from "./config";
import { pkceChallengeS256 } from "./jwt";
import {
  mintAuthCode,
  mintPendingState,
  mintSessionToken,
  readAuthCode,
  readPendingState,
  readSessionToken,
  sessionFromToken,
} from "./tokens";
import {
  buildEntraAuthorizeUrl,
  exchangeEntraCode,
  refreshEntraToken,
  tenantFromEntraTokens,
} from "./entra";
import type { HausbankSession } from "./session";

export function randomVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function unauthorizedMcpResponse(): Response {
  const meta = `${oauthPublicOrigin()}/.well-known/oauth-protected-resource`;
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer realm="HausbankAgent", resource_metadata="${meta}"`,
    },
  });
}

export function protectedResourceMetadata() {
  return {
    resource: mcpResourceUrl(),
    authorization_servers: [oauthPublicOrigin()],
    scopes_supported: ["hausbank_agent", "openid", "offline_access"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${oauthPublicOrigin()}/`,
  };
}

export function authorizationServerMetadata() {
  const origin = oauthPublicOrigin();
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/api/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    scopes_supported: ["hausbank_agent", "openid", "offline_access"],
  };
}

export function dynamicClientRegistration(body: Record<string, unknown>) {
  const redirectUris = Array.isArray(body.redirect_uris)
    ? (body.redirect_uris as string[])
    : ["https://claude.ai/api/mcp/auth_callback"];
  return {
    client_id: "hausbank-agent-claude",
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_secret_expires_at: 0,
    redirect_uris: redirectUris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    client_name:
      typeof body.client_name === "string" ? body.client_name : "Claude",
  };
}

/** Start Entra login after environment/company collected. */
export function beginEntraAuthorize(args: {
  redirectUri: string;
  clientId: string;
  codeChallenge: string;
  claudeState: string;
  environmentName: string;
  companyId: string;
}): string {
  const entraCodeVerifier = randomVerifier();
  const entraChallenge = pkceChallengeS256(entraCodeVerifier);
  const state = mintPendingState({
    redirectUri: args.redirectUri,
    clientId: args.clientId,
    codeChallenge: args.codeChallenge,
    claudeState: args.claudeState,
    entraCodeVerifier,
    environmentName: args.environmentName.trim(),
    companyId: args.companyId.trim(),
  });
  return buildEntraAuthorizeUrl({
    state,
    codeChallenge: entraChallenge,
  });
}

export async function finishEntraCallback(args: {
  code: string;
  state: string;
}): Promise<{ redirectTo: string }> {
  const pending = readPendingState(args.state);
  const tokens = await exchangeEntraCode({
    code: args.code,
    codeVerifier: pending.entraCodeVerifier,
  });
  const who = tenantFromEntraTokens(tokens);
  const authCode = mintAuthCode({
    redirectUri: pending.redirectUri,
    clientId: pending.clientId,
    codeChallenge: pending.codeChallenge,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tenantId: who.tenantId,
    environmentName: pending.environmentName,
    companyId: pending.companyId,
    oid: who.oid,
    name: who.name,
    expiresIn: tokens.expires_in,
  });
  const u = new URL(pending.redirectUri);
  u.searchParams.set("code", authCode);
  u.searchParams.set("state", pending.claudeState);
  return { redirectTo: u.toString() };
}

export async function handleTokenRequest(
  form: URLSearchParams,
): Promise<Record<string, unknown>> {
  const grant = form.get("grant_type") ?? "";
  if (grant === "authorization_code") {
    const code = form.get("code") ?? "";
    const redirectUri = form.get("redirect_uri") ?? "";
    const codeVerifier = form.get("code_verifier") ?? "";
    if (!code || !codeVerifier) {
      throw new Error("code and code_verifier required");
    }
    const parsed = readAuthCode(code);
    if (redirectUri && parsed.redirectUri !== redirectUri) {
      throw new Error("redirect_uri mismatch");
    }
    const expected = pkceChallengeS256(codeVerifier);
    if (expected !== parsed.codeChallenge) {
      throw new Error("PKCE verification failed");
    }
    const expiresIn = parsed.expiresIn && parsed.expiresIn > 60 ? parsed.expiresIn : 3500;
    const access_token = mintSessionToken(
      {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        tenantId: parsed.tenantId,
        environmentName: parsed.environmentName,
        companyId: parsed.companyId,
        oid: parsed.oid,
        name: parsed.name,
      },
      expiresIn,
    );
    return {
      access_token,
      token_type: "Bearer",
      expires_in: expiresIn,
      refresh_token: parsed.refreshToken
        ? mintSessionToken(
            {
              accessToken: parsed.accessToken,
              refreshToken: parsed.refreshToken,
              tenantId: parsed.tenantId,
              environmentName: parsed.environmentName,
              companyId: parsed.companyId,
              oid: parsed.oid,
              name: parsed.name,
            },
            60 * 60 * 24 * 30,
          )
        : undefined,
      scope: "hausbank_agent",
    };
  }

  if (grant === "refresh_token") {
    const refresh = form.get("refresh_token") ?? "";
    if (!refresh) throw new Error("refresh_token required");
    const session = readSessionToken(refresh);
    if (!session.refreshToken) throw new Error("No Entra refresh token");
    const tokens = await refreshEntraToken(session.refreshToken);
    const who = tenantFromEntraTokens(tokens);
    const expiresIn = tokens.expires_in && tokens.expires_in > 60 ? tokens.expires_in : 3500;
    const access_token = mintSessionToken(
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? session.refreshToken,
        tenantId: who.tenantId || session.tenantId,
        environmentName: session.environmentName,
        companyId: session.companyId,
        oid: who.oid ?? session.oid,
        name: who.name ?? session.name,
      },
      expiresIn,
    );
    return {
      access_token,
      token_type: "Bearer",
      expires_in: expiresIn,
      refresh_token: mintSessionToken(
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? session.refreshToken,
          tenantId: who.tenantId || session.tenantId,
          environmentName: session.environmentName,
          companyId: session.companyId,
          oid: who.oid ?? session.oid,
          name: who.name ?? session.name,
        },
        60 * 60 * 24 * 30,
      ),
      scope: "hausbank_agent",
    };
  }

  throw new Error(`Unsupported grant_type: ${grant}`);
}

export function parseBearerSession(
  req: Request,
): HausbankSession | null {
  if (!oauthEnabled()) return null;
  const auth = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return null;
  try {
    return sessionFromToken(readSessionToken(m[1].trim()));
  } catch {
    return null;
  }
}

export { oauthEnabled, oauthCallbackUrl, mcpResourceUrl };
