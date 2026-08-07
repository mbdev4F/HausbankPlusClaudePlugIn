/**
 * Entra / Claude OAuth adapter config.
 * One multi-tenant Entra app; customers consent in their tenant.
 */

function env(key: string): string {
  return (process.env[key] ?? "").trim();
}

export function oauthPublicOrigin(): string {
  const explicit =
    env("HAUSBANK_AGENT_PUBLIC_ORIGIN") ||
    env("OAUTH_PUBLIC_ORIGIN") ||
    env("FINAPI_PUBLIC_ORIGIN");
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = env("VERCEL_URL");
  if (vercel) {
    return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
  }
  return "http://localhost:8787";
}

export function entraClientId(): string {
  return (
    env("ENTRA_CLIENT_ID") ||
    env("HAUSBANK_AGENT_ENTRA_CLIENT_ID") ||
    env("AZURE_CLIENT_ID")
  );
}

export function entraClientSecret(): string {
  return (
    env("ENTRA_CLIENT_SECRET") ||
    env("HAUSBANK_AGENT_ENTRA_CLIENT_SECRET") ||
    env("AZURE_CLIENT_SECRET")
  );
}

/** HMAC secret for our self-contained auth codes + session JWTs. */
export function oauthSigningSecret(): string {
  return (
    env("OAUTH_SIGNING_SECRET") ||
    env("HAUSBANK_AGENT_OAUTH_SIGNING_SECRET") ||
    entraClientSecret() ||
    "dev-only-change-me"
  );
}

export function oauthEnabled(): boolean {
  return Boolean(entraClientId() && entraClientSecret());
}

/** Entra authorize/token host — multi-tenant "organizations". */
export function entraAuthority(): string {
  return (
    env("ENTRA_AUTHORITY") ||
    "https://login.microsoftonline.com/organizations"
  ).replace(/\/$/, "");
}

export function entraScopes(): string {
  return (
    env("ENTRA_SCOPES") ||
    "https://api.businesscentral.dynamics.com/user_impersonation offline_access openid profile"
  );
}

export function oauthCallbackUrl(): string {
  return `${oauthPublicOrigin()}/api/oauth/callback`;
}

export function mcpResourceUrl(): string {
  return `${oauthPublicOrigin()}/api/mcp`;
}
