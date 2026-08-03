import {
  CB_CONNECT_SANDBOX_DEFAULTS,
  type CbConnectEndpoints,
  type CbConnectEndpointsPublic,
} from "./endpoints-shared.js";

function envUrl(key: string): string {
  return (process.env[key] ?? "").trim();
}

/** Merge sandbox defaults with optional CBCON_URL_* overrides. */
export function resolveCbConnectEndpoints(): CbConnectEndpoints {
  const d = CB_CONNECT_SANDBOX_DEFAULTS;
  return {
    accountBalanceHealthUrl:
      envUrl("CBCON_URL_ACCOUNT_BALANCE_HEALTH") || d.accountBalanceHealthUrl,
    accountBalanceUrl:
      envUrl("CBCON_URL_ACCOUNT_BALANCE") || d.accountBalanceUrl,
    swiftG4cUrl: envUrl("CBCON_URL_SWIFT_G4C") || d.swiftG4cUrl,
    oauthTokenUrl: envUrl("CBCON_URL_OAUTH_TOKEN") || d.oauthTokenUrl,
    instantPaymentInitiationUrl:
      envUrl("CBCON_URL_INSTANT_PAYMENT_INIT") || d.instantPaymentInitiationUrl,
    instantPaymentStatusUrl:
      envUrl("CBCON_URL_INSTANT_PAYMENT_STATUS") || d.instantPaymentStatusUrl,
    instantPaymentHealthUrl:
      envUrl("CBCON_URL_INSTANT_PAYMENT_HEALTH") || d.instantPaymentHealthUrl,
    verificationOfPayeeUrl:
      envUrl("CBCON_URL_VOP") || d.verificationOfPayeeUrl,
    accountPreValidationUrl:
      envUrl("CBCON_URL_ACCOUNT_PREVALIDATION") || d.accountPreValidationUrl,
    fx4CashInitiationUrl:
      envUrl("CBCON_URL_FX4CASH_INIT") || d.fx4CashInitiationUrl,
    fx4CashStatusReportUrl:
      envUrl("CBCON_URL_FX4CASH_STATUS") || d.fx4CashStatusReportUrl,
    fx4CashValueDateUrl:
      envUrl("CBCON_URL_FX4CASH_VALUE_DATE") || d.fx4CashValueDateUrl,
    statementsRequestUrl:
      envUrl("CBCON_URL_STATEMENTS_REQUEST") || d.statementsRequestUrl,
    statementsLoadUrl:
      envUrl("CBCON_URL_STATEMENTS_LOAD") || d.statementsLoadUrl,
    statementsVersion: (envUrl("CBCON_STATEMENTS_VERSION") ||
      d.statementsVersion) as CbConnectEndpoints["statementsVersion"],
  };
}

/**
 * Compatibility shim for HealthFlow services that called the team endpoints store.
 * `teamId` is ignored — MCP uses process env + sandbox defaults.
 */
export async function cbConnectEndpointsGetPublic(
  _teamId?: string
): Promise<CbConnectEndpointsPublic> {
  const endpoints = resolveCbConnectEndpoints();
  return {
    ...endpoints,
    updatedAt: null,
    hasStoredEndpoints: false,
    source: "defaults",
  };
}
