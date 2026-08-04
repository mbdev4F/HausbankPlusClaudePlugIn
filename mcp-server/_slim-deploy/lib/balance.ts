/**
 * Slim entry: only auth probe + realtime balance for Claude Cloud.
 * Avoid importing ../src/operations (pulls statements/FX/etc.).
 */
import {
  cbConnectFetchAccessToken,
  cbConnectFetchAccountBalance,
  cbConnectGetHealth,
} from "../src/cb-connect/cb-connect-client";
import { parseCbConnectBalanceFromBody } from "../src/cb-connect/cb-connect-balance-parse";
import { resolveCbConnectEndpoints } from "../src/cb-connect/endpoints-store";
import {
  nativeBankGetResolvedCredentials,
  validateCredentialsForBankingApi,
  validateCredentialsForToken,
} from "../src/cb-connect/resolved-credentials";
import {
  hasCbconEnv,
  readCbconEnv,
  readCbconTlsInsecure,
} from "../src/cb-connect/env-config";

async function bankingSession() {
  const creds = await nativeBankGetResolvedCredentials("mcp");
  const err = validateCredentialsForBankingApi(creds);
  if (err) throw new Error(err);
  const endpoints = resolveCbConnectEndpoints();
  const { accessToken, expiresInSec } = await cbConnectFetchAccessToken(
    creds,
    endpoints.oauthTokenUrl,
  );
  return { creds, endpoints, accessToken, expiresInSec };
}

export async function probeAuthSetup() {
  const env = readCbconEnv();
  const creds = await nativeBankGetResolvedCredentials();
  return {
    hasEnvCredentials: hasCbconEnv(),
    tlsInsecure: readCbconTlsInsecure(),
    clientIdPresent: Boolean(env.clientId),
    keyIdPresent: Boolean(env.keyId),
    xCustomerIdentifierPresent: Boolean(env.xCustomerIdentifier),
    certificatePresent: Boolean(env.certificateBase64),
    certificatePasswordPresent: Boolean(env.certificatePassword),
    tokenValidation: validateCredentialsForToken(creds),
    bankingValidation: validateCredentialsForBankingApi(creds),
    endpoints: resolveCbConnectEndpoints(),
  };
}

export async function probeTokenAndHealth() {
  const { creds, endpoints, accessToken, expiresInSec } = await bankingSession();
  const health = await cbConnectGetHealth(
    creds,
    endpoints.accountBalanceHealthUrl,
    accessToken,
  );
  return {
    tokenExpiresInSec: expiresInSec,
    healthStatus: health.healthStatus,
    healthHttpStatus: health.status,
  };
}

export async function getRealtimeBalance(params: {
  branchIdentifier: string;
  accountCurrency: string;
  accountIdentifier: string;
}) {
  const { creds, endpoints, accessToken } = await bankingSession();
  const result = await cbConnectFetchAccountBalance(
    creds,
    endpoints.accountBalanceUrl,
    accessToken,
    params,
  );
  const parsed = parseCbConnectBalanceFromBody(result.body);
  return {
    ...parsed,
    correlationId: result.correlationId,
    resolvedUrl: result.resolvedUrl,
    httpStatus: result.status,
    rawBody: result.body,
  };
}
