import { readSmeDbEnv } from "./env-config.js";
import type { SmeDbEndpoints } from "./shared.js";

export type SmeDbResolvedCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  environment: "sandbox" | "live";
  publicOrigin: string | null;
  endpoints: SmeDbEndpoints;
};

export function smeDbGetResolvedCredentials(): SmeDbResolvedCredentials {
  const e = readSmeDbEnv();
  return {
    clientId: e.clientId,
    clientSecret: e.clientSecret,
    refreshToken: e.refreshToken,
    environment: e.environment,
    publicOrigin: e.publicOrigin,
    endpoints: e.endpoints,
  };
}

export function validateSmeDbClientCredentials(
  creds: SmeDbResolvedCredentials
): string | null {
  if (!creds.clientId) return "SME_DB_CLIENT_ID fehlt.";
  if (!creds.clientSecret) return "SME_DB_CLIENT_SECRET fehlt.";
  return null;
}

export function validateSmeDbUserSession(
  creds: SmeDbResolvedCredentials
): string | null {
  const clientErr = validateSmeDbClientCredentials(creds);
  if (clientErr) return clientErr;
  if (!creds.refreshToken) {
    return (
      "SME_DB_REFRESH_TOKEN fehlt. Für Claude Custom Connectors mit Token nur im Client: " +
      "separates Projekt BizBankingConnect nutzen. Legacy: sme_db_oauth_start / Callback."
    );
  }
  return null;
}
