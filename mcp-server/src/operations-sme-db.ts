/**
 * MCP operations for SME Deutsche Bank Connector
 * (HealthFlow/Cash365 Deutsche Bank Biz-Banking → renamed).
 */

import {
  smeDbCheckInstantReachability,
  smeDbCompleteScaChallenge,
  smeDbFetchAccounts,
  smeDbFetchCreditCards,
  smeDbFetchTransactions,
  smeDbGetPaymentStatus,
  smeDbInitiateInstantPayment,
  smeDbListScaMethods,
  smeDbStartScaChallenge,
} from "./sme-deutsche-bank/api-client.js";
import {
  hasSmeDbEnv,
  readSmeDbEnv,
  smeDbOAuthCallbackPath,
} from "./sme-deutsche-bank/env-config.js";
import {
  buildSmeDbOAuthStart,
  exchangeSmeDbAuthorizationCode,
  getSmeDbAccessToken,
  probeSmeDbAuthorizeReachability,
  SmeDbApiError,
} from "./sme-deutsche-bank/oauth.js";
import {
  smeDbGetResolvedCredentials,
  validateSmeDbClientCredentials,
  validateSmeDbUserSession,
} from "./sme-deutsche-bank/resolved-credentials.js";
import { CONNECTOR_DISPLAY_NAME } from "./sme-deutsche-bank/shared.js";

export async function smeDbProbeAuth() {
  const env = readSmeDbEnv();
  const creds = smeDbGetResolvedCredentials();
  const clientErr = validateSmeDbClientCredentials(creds);
  const userErr = validateSmeDbUserSession(creds);

  let accessTokenOk = false;
  let accessTokenError: string | null = null;

  if (!userErr) {
    try {
      await getSmeDbAccessToken();
      accessTokenOk = true;
    } catch (e) {
      accessTokenError =
        e instanceof SmeDbApiError
          ? `${e.message}: ${e.body.slice(0, 200)}`
          : e instanceof Error
            ? e.message
            : String(e);
    }
  }

  return {
    ok: accessTokenOk || (!clientErr && !userErr),
    connector: CONNECTOR_DISPLAY_NAME,
    legacyNames: [
      "Deutsche Bank Biz-Banking",
      "Business Connector",
      "DB SME Connector",
    ],
    hasEnvCredentials: hasSmeDbEnv(),
    environment: env.environment,
    tokenUrl: env.endpoints.tokenUrl,
    cashAccountsUrl: env.endpoints.cashAccountsUrl,
    clientIdPresent: Boolean(env.clientId),
    clientSecretPresent: Boolean(env.clientSecret),
    refreshTokenPresent: Boolean(env.refreshToken),
    publicOrigin: env.publicOrigin,
    oauthCallbackPath: smeDbOAuthCallbackPath(),
    clientValidationError: clientErr,
    userValidationError: userErr,
    accessTokenOk,
    accessTokenError,
  };
}

export async function smeDbOauthStart(args?: {
  redirectUri?: string;
  probe?: boolean;
}) {
  const started = buildSmeDbOAuthStart({ redirectUri: args?.redirectUri });
  let probe: Awaited<ReturnType<typeof probeSmeDbAuthorizeReachability>> | null =
    null;
  if (args?.probe !== false) {
    probe = await probeSmeDbAuthorizeReachability(started.authorizeUrl);
  }
  return {
    ok: probe ? probe.ok : true,
    connector: CONNECTOR_DISPLAY_NAME,
    authorizeUrl: started.authorizeUrl,
    redirectUri: started.redirectUri,
    state: started.state,
    probe,
    note: "Authorize-URL im Browser öffnen. Nach Callback Refresh-Token als SME_DB_REFRESH_TOKEN speichern (Callback-Seite zeigt ihn einmalig).",
  };
}

export async function smeDbOauthComplete(args: {
  code: string;
  redirectUri?: string;
}) {
  const tokens = await exchangeSmeDbAuthorizationCode(
    args.code,
    args.redirectUri
  );
  return {
    ok: true,
    connector: CONNECTOR_DISPLAY_NAME,
    hasAccessToken: Boolean(tokens.access_token),
    refreshToken: tokens.refresh_token ?? null,
    expiresIn: tokens.expires_in ?? null,
    scope: tokens.scope ?? null,
    message: tokens.refresh_token
      ? "Bitte SME_DB_REFRESH_TOKEN mit dem zurückgegebenen refreshToken setzen (wird vom MCP nicht persistiert)."
      : "Kein neuer refresh_token in der Antwort — bestehenden Token behalten.",
  };
}

export async function smeDbListAccounts() {
  const { accounts, raw } = await smeDbFetchAccounts();
  return { ok: true, connector: CONNECTOR_DISPLAY_NAME, accounts, raw };
}

export async function smeDbListTransactions(args: {
  iban: string;
  limit?: number;
  bookingDateFrom?: string;
}) {
  const { transactions, raw } = await smeDbFetchTransactions(args);
  return {
    ok: true,
    connector: CONNECTOR_DISPLAY_NAME,
    iban: args.iban.replace(/\s/g, ""),
    transactions,
    raw,
  };
}

export async function smeDbInstantReachability(args: { creditorIban: string }) {
  const result = await smeDbCheckInstantReachability(args.creditorIban);
  return { ok: true, connector: CONNECTOR_DISPLAY_NAME, ...result };
}

export async function smeDbListScaMethodsOp() {
  const result = await smeDbListScaMethods();
  return { ok: true, connector: CONNECTOR_DISPLAY_NAME, ...result };
}

export async function smeDbStartScaChallengeOp(args: {
  method: string;
  amount: number;
  currency?: string;
  targetIban: string;
  language?: string;
}) {
  const result = await smeDbStartScaChallenge(args);
  return { ok: true, connector: CONNECTOR_DISPLAY_NAME, ...result };
}

export async function smeDbCompleteScaChallengeOp(args: {
  challengeId: string;
  tan: string;
}) {
  const result = await smeDbCompleteScaChallenge(args);
  return { ok: true, connector: CONNECTOR_DISPLAY_NAME, ...result };
}

export async function smeDbInitiateInstantPaymentOp(args: {
  debtorIban: string;
  creditorName: string;
  creditorIban: string;
  amount: number;
  currency?: string;
  endToEndIdentification?: string;
  remittanceInformationUnstructured?: string;
  otp: string;
}) {
  const result = await smeDbInitiateInstantPayment(args);
  return { ok: true, connector: CONNECTOR_DISPLAY_NAME, ...result };
}

export async function smeDbGetPaymentStatusOp(args: { paymentId: string }) {
  const result = await smeDbGetPaymentStatus(args.paymentId);
  return { ok: true, connector: CONNECTOR_DISPLAY_NAME, ...result };
}

export async function smeDbListCreditCards() {
  const result = await smeDbFetchCreditCards();
  return { ok: true, connector: CONNECTOR_DISPLAY_NAME, ...result };
}
