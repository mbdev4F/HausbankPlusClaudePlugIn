/**
 * Thin MCP-facing operations over HealthFlow CB-Connect connectors.
 * Credentials/endpoints come from env (CBCON_*), not the Next.js team store.
 */

import { randomUUID } from "node:crypto";
import {
  cbConnectFetchAccessToken,
  cbConnectFetchAccountBalance,
  cbConnectGetHealth,
  cbConnectSignedPostResult,
  cbConnectSwiftTrackerStatusPost,
} from "./cb-connect/cb-connect-client.js";
import { parseCbConnectBalanceFromBody } from "./cb-connect/cb-connect-balance-parse.js";
import {
  buildCbConnectInstantPaymentBody,
  formatCbConnectInstantPaymentStatusJson,
} from "./cb-connect/cb-connect-instant-payment-build.js";
import { parseCbConnectInstantPaymentResponse } from "./cb-connect/cb-connect-instant-payment-parse.js";
import {
  createAccountBalanceCorrelationId,
  createCbConnectCorrelationId,
  formatCbConnectApiTimestamp,
} from "./cb-connect/cb-connect-signing-core.js";
import {
  buildCbConnectVopRequestBody,
  parseCbConnectVopResponse,
} from "./cb-connect/cb-connect-vop-parse.js";
import {
  buildSwiftTrackerProbeBody,
  type SwiftTrackerProbeScenario,
} from "./cb-connect/cb-connect-swift-tracker-probe-shared.js";
import {
  cbConnectExecuteStatementLoad,
  cbConnectExecuteStatementRequest,
} from "./cb-connect/cb-connect-statements-api.js";
import type { CbConnectStatementType } from "./cb-connect/cb-connect-statements-parse.js";
import {
  cbConnectFx4CashInitiate,
  cbConnectFx4CashStatusReport,
  cbConnectFx4CashEvaluateValueDate,
} from "./cb-connect/cb-connect-fx4cash-service.js";
import type { Fx4CashInitiationParams } from "./cb-connect/cb-connect-fx4cash-shared.js";
import { resolveCbConnectEndpoints } from "./cb-connect/endpoints-store.js";
import {
  nativeBankGetResolvedCredentials,
  validateCredentialsForBankingApi,
  validateCredentialsForToken,
} from "./cb-connect/resolved-credentials.js";
import {
  hasCbconEnv,
  readCbconEnv,
  readCbconTlsInsecure,
} from "./cb-connect/env-config.js";

const MCP_TEAM = "mcp";

async function bankingSession() {
  const creds = await nativeBankGetResolvedCredentials(MCP_TEAM);
  const err = validateCredentialsForBankingApi(creds);
  if (err) throw new Error(err);
  const endpoints = resolveCbConnectEndpoints();
  const { accessToken, expiresInSec } = await cbConnectFetchAccessToken(
    creds,
    endpoints.oauthTokenUrl
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
    accessToken
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
    params
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

export async function requestAccountStatement(params: {
  branchIdentifier: string;
  accountCurrency: string;
  accountIdentifier: string;
  dateFrom: string;
  dateTo: string;
  statementType?: CbConnectStatementType;
}) {
  return cbConnectExecuteStatementRequest(MCP_TEAM, {
    branchIdentifier: params.branchIdentifier,
    accountCurrency: params.accountCurrency,
    accountIdentifier: params.accountIdentifier,
    fromDate: params.dateFrom,
    toDate: params.dateTo,
    statementType: params.statementType,
  });
}

export async function loadAccountStatement(params: {
  serviceRequestId: string;
}) {
  return cbConnectExecuteStatementLoad(MCP_TEAM, params.serviceRequestId);
}

export async function verifyPayee(params: {
  payeeName: string;
  payeeIban: string;
  debtorIban: string;
}) {
  const { creds, endpoints, accessToken } = await bankingSession();
  const body = buildCbConnectVopRequestBody(params);
  const correlationId = createAccountBalanceCorrelationId();
  const res = await cbConnectSignedPostResult(
    creds,
    endpoints.verificationOfPayeeUrl,
    accessToken,
    body,
    {
      "x-customer-identifier": creds.xCustomerIdentifier,
      "x-correlation-identifier": correlationId,
      "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
    }
  );
  const parsed = parseCbConnectVopResponse(res.body);
  return {
    httpStatus: res.status,
    correlationId,
    requestBody: body,
    ...parsed,
    rawBody: res.body,
  };
}

export async function initiateInstantPayment(params: {
  debtorName: string;
  debtorIban: string;
  debtorBic: string;
  creditorName: string;
  creditorIban: string;
  creditorBic: string;
  amount: number;
  currency?: string;
  remittanceInfo?: string;
  executionDate?: string;
}) {
  const { creds, endpoints, accessToken } = await bankingSession();
  const endToEndIdentification = randomUUID()
    .replace(/[-{}]/g, "")
    .slice(0, 35);
  const paymentInformationId = createCbConnectCorrelationId("PMT").slice(0, 35);
  const payload = buildCbConnectInstantPaymentBody({
    paymentInformationId,
    debtorName: params.debtorName,
    debtorIban: params.debtorIban,
    debtorBic: params.debtorBic,
    creditorName: params.creditorName,
    creditorIban: params.creditorIban,
    creditorBic: params.creditorBic,
    amount: params.amount,
    currency: params.currency ?? "EUR",
    endToEndIdentification,
    executionDate: params.executionDate,
  });

  if (params.remittanceInfo?.trim()) {
    const cti = (
      payload.customerCreditTransferInitiation as {
        paymentInformation?: Array<{
          creditTransferTransactionInformation?: Array<Record<string, unknown>>;
        }>;
      }
    ).paymentInformation?.[0]?.creditTransferTransactionInformation?.[0];
    if (cti) {
      cti.remittanceInformation = {
        unstructured: params.remittanceInfo.trim().slice(0, 140),
      };
    }
  }

  const requestJson = JSON.stringify(payload);
  const correlationId = createCbConnectCorrelationId("INST");
  const res = await cbConnectSignedPostResult(
    creds,
    endpoints.instantPaymentInitiationUrl,
    accessToken,
    requestJson,
    {
      "x-customer-identifier": creds.xCustomerIdentifier,
      "x-correlation-identifier": correlationId,
      "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
    }
  );
  const parsed = parseCbConnectInstantPaymentResponse(res.body);
  return {
    httpStatus: res.status,
    correlationId,
    endToEndIdentification,
    paymentInformationId,
    requestJson,
    parsed,
    rawBody: res.body,
  };
}

export async function getInstantPaymentStatus(params: {
  debtorIban: string;
  endToEndIdentification: string;
}) {
  const { creds, endpoints, accessToken } = await bankingSession();
  const body = formatCbConnectInstantPaymentStatusJson({
    debtorIban: params.debtorIban,
    endToEndIdentification: params.endToEndIdentification,
  });
  const correlationId = createCbConnectCorrelationId("INST");
  const res = await cbConnectSignedPostResult(
    creds,
    endpoints.instantPaymentStatusUrl,
    accessToken,
    body,
    {
      "x-customer-identifier": creds.xCustomerIdentifier,
      "x-correlation-identifier": correlationId,
      "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
    }
  );
  return {
    httpStatus: res.status,
    correlationId,
    requestBody: body,
    parsed: parseCbConnectInstantPaymentResponse(res.body),
    rawBody: res.body,
  };
}

export async function getSwiftPaymentStatus(params: {
  scenario?: SwiftTrackerProbeScenario;
  uetr?: string;
  branchIdentifier?: string;
  clientBic?: string;
  accountIdentifier?: string;
  serviceLevel?: string;
  startDateTime?: string;
  endDateTime?: string;
  creditorAccount?: string;
  maximumNumber?: string;
  next?: string;
}) {
  const { creds, endpoints, accessToken } = await bankingSession();
  const scenario = params.scenario ?? "uetr";
  const branchIdentifier = params.branchIdentifier ?? "deutdeff";
  const clientBic = params.clientBic ?? branchIdentifier;
  const accountIdentifier = params.accountIdentifier ?? "";
  const body = buildSwiftTrackerProbeBody(scenario, {
    branchIdentifier,
    clientBic,
    accountIdentifier,
    serviceLevel: params.serviceLevel ?? "G007",
    uetr: params.uetr ?? "",
    next: params.next ?? "",
    startDateTime: params.startDateTime ?? "",
    endDateTime: params.endDateTime ?? "",
    creditorAccount: params.creditorAccount ?? "",
    maximumNumber: params.maximumNumber ?? "10",
  });
  const correlationId = createCbConnectCorrelationId("SWFT");
  const result = await cbConnectSwiftTrackerStatusPost(
    creds,
    endpoints.swiftG4cUrl,
    accessToken,
    body,
    {
      branchIdentifier,
      accountIdentifier,
      clientBic,
      correlationId,
    },
    { allowErrorStatus: true }
  );
  return {
    httpStatus: result.status,
    correlationId: result.correlationId,
    requestBody: body,
    rawBody: result.body,
  };
}

export async function initiateFx4Cash(params?: Partial<Fx4CashInitiationParams>) {
  return cbConnectFx4CashInitiate(MCP_TEAM, params);
}

export async function getFx4CashStatus(params: {
  debtorIban: string;
  endToEndIdentification: string;
}) {
  return cbConnectFx4CashStatusReport(MCP_TEAM, params);
}

export async function evaluateFx4CashValueDate(params: {
  accountNumber: string;
  currencyPair: string;
  suggestedValueDate: string;
}) {
  return cbConnectFx4CashEvaluateValueDate(MCP_TEAM, params);
}
