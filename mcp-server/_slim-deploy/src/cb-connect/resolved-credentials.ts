import { readCbconEnv } from "./env-config";

export type NativeBankResolvedCredentials = {
  clientId: string;
  clientSecret: string;
  xCustomerIdentifier: string;
  keyId: string;
  certificateBase64: string;
  certificatePassword: string;
};

/**
 * CB-Connect credentials for the MCP process.
 * Loaded from CBCON_* env vars (no team store).
 * `teamId` is accepted for API compatibility with HealthFlow services and ignored.
 */
export async function nativeBankGetResolvedCredentials(
  _teamId?: string
): Promise<NativeBankResolvedCredentials> {
  const e = readCbconEnv();
  return {
    clientId: e.clientId,
    clientSecret: e.clientSecret,
    xCustomerIdentifier: e.xCustomerIdentifier,
    keyId: e.keyId,
    certificateBase64: e.certificateBase64,
    certificatePassword: e.certificatePassword,
  };
}

export function validateCredentialsForToken(
  creds: NativeBankResolvedCredentials
): string | null {
  if (!creds.clientId) return "Client ID fehlt.";
  if (!creds.clientSecret) return "Client Secret fehlt.";
  return null;
}

export function validateCredentialsForSignedApi(
  creds: NativeBankResolvedCredentials
): string | null {
  const tokenErr = validateCredentialsForToken(creds);
  if (tokenErr) return tokenErr;
  if (!creds.certificateBase64) return "mTLS-Zertifikat fehlt.";
  if (!creds.certificatePassword) return "Zertifikats-Passwort fehlt.";
  return null;
}

export function validateCredentialsForBankingApi(
  creds: NativeBankResolvedCredentials
): string | null {
  const signedErr = validateCredentialsForSignedApi(creds);
  if (signedErr) return signedErr;
  if (!creds.xCustomerIdentifier) return "X-Customer-Identifier fehlt.";
  return null;
}

export function validateCredentialsForApi(
  creds: NativeBankResolvedCredentials
): string | null {
  return validateCredentialsForSignedApi(creds);
}
