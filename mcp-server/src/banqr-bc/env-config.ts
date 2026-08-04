/**
 * Hausbank-Agent CloudConnector credentials from env.
 */

function env(key: string): string {
  const direct = (process.env[key] ?? "").trim();
  if (direct) return direct;
  for (const [k, v] of Object.entries(process.env)) {
    if (k.trim() === key && typeof v === "string") return v.trim();
  }
  return "";
}

export type BanqrBcEnv = {
  tenantId: string;
  environmentName: string;
  clientId: string;
  clientSecret: string;
  companyId: string;
  bcBaseUrl: string;
  loginBaseUrl: string;
  oauthScope: string;
};

export function readBanqrBcEnv(): BanqrBcEnv {
  return {
    tenantId:
      env("HAUSBANK_AGENT_TENANT_ID") ||
      env("HB365_TENANT_ID") ||
      env("BC_TENANT_ID") ||
      env("BANQR_BC_TENANT_ID"),
    environmentName:
      env("HAUSBANK_AGENT_ENVIRONMENT_NAME") ||
      env("HB365_ENVIRONMENT_NAME") ||
      env("BC_ENVIRONMENT_NAME") ||
      env("BANQR_BC_ENVIRONMENT_NAME"),
    clientId:
      env("HAUSBANK_AGENT_CLIENT_ID") ||
      env("HB365_CLIENT_ID") ||
      env("BC_CLIENT_ID") ||
      env("BANQR_BC_CLIENT_ID"),
    clientSecret:
      env("HAUSBANK_AGENT_CLIENT_SECRET") ||
      env("HB365_CLIENT_SECRET") ||
      env("BC_CLIENT_SECRET") ||
      env("BANQR_BC_CLIENT_SECRET"),
    companyId:
      env("HAUSBANK_AGENT_COMPANY_ID") ||
      env("HB365_COMPANY_ID") ||
      env("BC_COMPANY_ID") ||
      env("BANQR_BC_COMPANY_ID"),
    bcBaseUrl: (
      env("HAUSBANK_AGENT_BASE_URL") ||
      env("HB365_BASE_URL") ||
      env("BC_BASE_URL") ||
      "https://api.businesscentral.dynamics.com"
    ).replace(/\/$/, ""),
    loginBaseUrl: (
      env("HAUSBANK_AGENT_LOGIN_BASE_URL") ||
      env("HB365_LOGIN_BASE_URL") ||
      env("BC_LOGIN_BASE_URL") ||
      "https://login.microsoftonline.com"
    ).replace(/\/$/, ""),
    oauthScope:
      env("HAUSBANK_AGENT_OAUTH_SCOPE") ||
      env("HB365_OAUTH_SCOPE") ||
      env("BC_OAUTH_SCOPE") ||
      "https://api.businesscentral.dynamics.com/.default",
  };
}

export function hasBanqrBcEnv(): boolean {
  const e = readBanqrBcEnv();
  return Boolean(e.tenantId || e.clientId || e.clientSecret);
}

export function validateBanqrBcClientCredentials(e: BanqrBcEnv): string | null {
  if (!e.tenantId) return "HAUSBANK_AGENT_TENANT_ID fehlt.";
  if (!e.environmentName) return "HAUSBANK_AGENT_ENVIRONMENT_NAME fehlt.";
  if (!e.clientId) return "HAUSBANK_AGENT_CLIENT_ID fehlt.";
  if (!e.clientSecret) return "HAUSBANK_AGENT_CLIENT_SECRET fehlt.";
  return null;
}

export function banqrBcApiRoot(e: BanqrBcEnv): string {
  return `${e.bcBaseUrl}/v2.0/${e.tenantId}/${e.environmentName}`;
}
