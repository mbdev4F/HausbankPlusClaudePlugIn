/**
 * Deutsche Bank CB-Connect — Sandbox-Standard-URLs (wie BC Rec.Validate).
 * Quelle: Business Central CB-Connect Setup, Umgebung SBX.
 */

import type { CbConnectEndpoints } from "./endpoints-shared";

export const CB_CONNECT_SANDBOX_DEFAULTS: CbConnectEndpoints = {
  accountBalanceHealthUrl:
    "https://api.sbx.baas.db.com/v1/oauth/banking/accounts/health",
  accountBalanceUrl:
    "https://api.sbx.baas.db.com/v1/oauth/banking/accounts/balances?branchIdentifier=%1&accountCurrency=%2&accountIdentifier=%3",
  swiftG4cUrl:
    "https://api.sbx.baas.db.com/v1/oauth/payments/swift/gpiforcorporates/status",
  oauthTokenUrl:
    "https://uat.cidp.db.com/am/oauth2/global/access_token?grant_type=client_credentials&scope=apim",
  instantPaymentInitiationUrl:
    "https://api.sbx.baas.db.com/v3/oauth/payments/instant-transfer/sepa/payment",
  instantPaymentStatusUrl:
    "https://api.sbx.baas.db.com/v3/oauth/payments/instant-transfer/sepa/status",
  instantPaymentHealthUrl:
    "https://api.sbx.baas.db.com/v1/oauth/payments/instant-transfer/sepa/health",
  verificationOfPayeeUrl:
    "https://api.sbx.baas.db.com/v1/oauth/payments/sepa/vop-check/vop",
  accountPreValidationUrl:
    "https://api.sbx.baas.db.com/v1/oauth/payments/account-prevalidation/validate",
  fx4CashInitiationUrl:
    "https://api.sbx.baas.db.com/v1/oauth/payments/cross-border/FX4Cash/payments/initiation",
  fx4CashStatusReportUrl:
    "https://api.sbx.baas.db.com/v1/oauth/payments/cross-border/FX4Cash/payments/status-report",
  fx4CashValueDateUrl:
    "https://api.sbx.baas.db.com/v1/oauth/payments/cross-border/FX4Cash/valueDate",
  statementsRequestUrl:
    "https://api.sbx.baas.db.com/v1/oauth/banking/accounts/statement",
  statementsLoadUrl:
    "https://api.sbx.baas.db.com/v1/oauth/banking/accounts/statement/camt?service-request-identifier=",
  statementsVersion: "V2",
};
