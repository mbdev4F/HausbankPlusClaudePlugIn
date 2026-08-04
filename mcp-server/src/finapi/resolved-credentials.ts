import { readFinapiEnv, type FinapiEnvCredentials } from "./env-config.js";
import type { FinapiEndpoints } from "./shared.js";

export type FinapiResolvedCredentials = {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "live";
  userId: string;
  userPassword: string;
  publicOrigin: string | null;
  endpoints: FinapiEndpoints;
};

/**
 * finAPI credentials for the MCP process.
 * Loaded from FINAPI_* env vars (no team store).
 */
export function finapiGetResolvedCredentials(): FinapiResolvedCredentials {
  const e: FinapiEnvCredentials = readFinapiEnv();
  return {
    clientId: e.clientId,
    clientSecret: e.clientSecret,
    environment: e.environment,
    userId: e.userId,
    userPassword: e.userPassword,
    publicOrigin: e.publicOrigin,
    endpoints: e.endpoints,
  };
}

export function validateFinapiClientCredentials(
  creds: FinapiResolvedCredentials
): string | null {
  if (!creds.clientId) return "FINAPI_CLIENT_ID fehlt.";
  if (!creds.clientSecret) return "FINAPI_CLIENT_SECRET fehlt.";
  return null;
}

export function validateFinapiUserCredentials(
  creds: FinapiResolvedCredentials
): string | null {
  const clientErr = validateFinapiClientCredentials(creds);
  if (clientErr) return clientErr;
  if (!creds.userId) return "FINAPI_USER_ID fehlt — zuerst provision_user ausführen oder User in .env setzen.";
  if (!creds.userPassword) {
    return "FINAPI_USER_PASSWORD fehlt — zuerst provision_user ausführen oder Passwort in .env setzen.";
  }
  return null;
}
