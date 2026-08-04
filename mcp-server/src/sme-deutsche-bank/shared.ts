/**
 * SME Deutsche Bank Connector (formerly HealthFlow / Cash365 „Deutsche Bank Biz-Banking“).
 * OAuth + DBAPI on api.db.com / simulator-api.db.com — distinct from CB-Connect (Enterprise).
 */

export type SmeDbEnvironment = "sandbox" | "live";

export type SmeDbEndpoints = {
  authUrl: string;
  tokenUrl: string;
  scope: string;
  addressUrl: string;
  partnerUrl: string;
  cashAccountsUrl: string;
  transactionsUrl: string;
  creditCardsUrl: string;
  sccTransactionUrl: string;
  instantCreditTransUrl: string;
  instantCreditStatusUrl: string;
  challengesUrl: string;
  challengeMethodsUrl: string;
};

/** Cash365Setup.BizBankScope — identical for live and simulator. */
export const SME_DB_SCOPE =
  "read_additional_personal_data read_credit_card_transactions instant_sepa_credit_transfers read_accounts_list read_addresses age_certificate read_security_accounts_list read_transactions " +
  "verify_customer read_security_transactions offline_access income_analysis investments_report read_accounts sepa_credit_transfers read_additional_organization_data " +
  "verify_account_ownership rent_analysis read_partners_legi transaction_notifications read_credit_cards_list_with_details read_customer_data read_performances read_partners";

export const SME_DB_LIVE_DEFAULTS: SmeDbEndpoints = {
  authUrl:
    "https://api.db.com/gw/oidc/authorize?response_type=code&redirect_uri=%1&client_id=%2&state=%3&scope=%4",
  tokenUrl: "https://api.db.com/gw/oidc/token",
  scope: SME_DB_SCOPE,
  addressUrl: "https://api.db.com/gw/dbapi/referenceData/addresses/v2",
  partnerUrl: "https://api.db.com/gw/dbapi/referenceData/partners/v2",
  cashAccountsUrl: "https://api.db.com/gw/dbapi/banking/cashAccounts/v2",
  transactionsUrl: "https://api.db.com/gw/dbapi/banking/transactions/v2",
  creditCardsUrl: "https://api.db.com/gw/dbapi/cards/creditCards/v1",
  sccTransactionUrl:
    "https://api.db.com/gw/dbapi/cards/creditCardTransactions/v1",
  instantCreditTransUrl:
    "https://api.db.com/gw/dbapi/paymentInitiation/payments/v1/instantSepaCreditTransfers",
  instantCreditStatusUrl:
    "https://api.db.com/gw/dbapi/paymentInitiation/payments/v1/instantSepaCreditTransfers/creditorAccounts/%1/reachabilityStatus",
  challengesUrl:
    "https://api.db.com/gw/dbapi/others/transactionAuthorization/v1/challenges",
  challengeMethodsUrl:
    "https://api.db.com/gw/dbapi/others/transactionAuthorization/v1/challenges/methods",
};

export const SME_DB_SANDBOX_DEFAULTS: SmeDbEndpoints = {
  authUrl:
    "https://simulator-api.db.com/gw/oidc/authorize?response_type=code&redirect_uri=%1&client_id=%2&state=%3&scope=%4",
  tokenUrl: "https://simulator-api.db.com/gw/oidc/token",
  scope: SME_DB_SCOPE,
  addressUrl:
    "https://simulator-api.db.com/gw/dbapi/referenceData/addresses/v2",
  partnerUrl:
    "https://simulator-api.db.com/gw/dbapi/referenceData/partners/v2",
  cashAccountsUrl:
    "https://simulator-api.db.com/gw/dbapi/banking/cashAccounts/v2",
  transactionsUrl:
    "https://simulator-api.db.com/gw/dbapi/banking/transactions/v2",
  creditCardsUrl:
    "https://simulator-api.db.com/gw/dbapi/cards/creditCards/v1",
  sccTransactionUrl:
    "https://simulator-api.db.com/gw/dbapi/cards/creditCardTransactions/v1",
  instantCreditTransUrl:
    "https://simulator-api.db.com/gw/dbapi/paymentInitiation/payments/v1/instantSepaCreditTransfers",
  instantCreditStatusUrl:
    "https://simulator-api.db.com/gw/dbapi/paymentInitiation/payments/v1/instantSepaCreditTransfers/creditorAccounts/%1/reachabilityStatus",
  challengesUrl:
    "https://simulator-api.db.com/gw/dbapi/others/transactionAuthorization/v1/challenges",
  challengeMethodsUrl:
    "https://simulator-api.db.com/gw/dbapi/others/transactionAuthorization/v1/challenges/methods",
};

export function smeDbEndpointsForEnvironment(
  env: SmeDbEnvironment
): SmeDbEndpoints {
  return env === "live" ? SME_DB_LIVE_DEFAULTS : SME_DB_SANDBOX_DEFAULTS;
}

/**
 * Cash365 `StrSubstNo(AuthUrl, RedirectUrl, ClientId, State, Scopes)` or normal query URL.
 */
export function buildSmeDbAuthorizeUrl(
  authUrlTemplate: string,
  params: {
    redirectUri: string;
    clientId: string;
    state: string;
    scope: string;
  }
): string {
  const template = authUrlTemplate.trim();
  if (!template) throw new Error("Authorization-URL fehlt.");

  if (template.includes("%1")) {
    const enc = (v: string) => encodeURIComponent(v);
    return template
      .replace("%4", enc(params.scope))
      .replace("%3", enc(params.state))
      .replace("%2", enc(params.clientId))
      .replace("%1", enc(params.redirectUri));
  }

  const url = new URL(template);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("state", params.state);
  if (params.scope) url.searchParams.set("scope", params.scope);
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export type SmeDbTokenResponse = {
  access_token: string;
  token_type?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
};

export type SmeDbAccount = {
  iban: string;
  currencyCode: string | null;
  bic: string | null;
  accountType: string | null;
  currentBalance: number | null;
  productDescription: string | null;
};

export type SmeDbTransaction = {
  id: string | null;
  originIban: string | null;
  amount: number | null;
  counterPartyName: string | null;
  counterPartyIban: string | null;
  bookingDate: string | null;
  valueDate: string | null;
  currencyCode: string | null;
  paymentReference: string | null;
  e2eReference: string | null;
  mandateReference: string | null;
};

export const CONNECTOR_DISPLAY_NAME = "SME Deutsche Bank Connector";
