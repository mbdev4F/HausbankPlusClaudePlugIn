/**
 * MCP-facing operations for Hausbank365 CloudConnector APIs.
 */

import {
  banqrBcRequest,
  getBanqrBcAccessToken,
} from "./banqr-bc/client";
import {
  hasBanqrBcEnv,
  readBanqrBcEnv,
  validateBanqrBcClientCredentials,
} from "./banqr-bc/env-config";

function companyPath(segment: string) {
  return `/api/banqr/${segment}/companies({companyId})`;
}

export async function bcProbeAuth() {
  const { getHausbankSession } = await import("./oauth/session");
  const session = getHausbankSession();
  if (session) {
    return {
      ok: true,
      authMode: "oauth_session",
      tenantId: session.tenantId,
      environmentName: session.environmentName,
      companyId: session.companyId || null,
      oid: session.oid ?? null,
      name: session.name ?? null,
      tokenOk: Boolean(session.accessToken),
    };
  }

  const env = readBanqrBcEnv();
  const err = validateBanqrBcClientCredentials(env);
  let tokenOk = false;
  let tokenError: string | null = null;
  if (!err) {
    try {
      await getBanqrBcAccessToken(env);
      tokenOk = true;
    } catch (e) {
      tokenError = e instanceof Error ? e.message : String(e);
    }
  }
  return {
    ok: tokenOk,
    authMode: "client_credentials_env",
    hasEnvCredentials: hasBanqrBcEnv(),
    tenantIdPresent: Boolean(env.tenantId),
    environmentNamePresent: Boolean(env.environmentName),
    clientIdPresent: Boolean(env.clientId),
    clientSecretPresent: Boolean(env.clientSecret),
    companyIdPresent: Boolean(env.companyId),
    companyId: env.companyId || null,
    bcBaseUrl: env.bcBaseUrl,
    validationError: err,
    tokenOk,
    tokenError,
  };
}

export async function bcListCompanies() {
  const { data } = await banqrBcRequest({
    path: "/api/banqr/bankaccounts/v1.1/companies",
  });
  return { ok: true, data };
}

/** Low-level escape hatch for any Hausbank365 API call. */
export async function bcRequest(args: {
  method?: string;
  path: string;
  query?: string;
  body?: unknown;
  ifMatch?: string;
  companyId?: string;
}) {
  const { status, data, etag } = await banqrBcRequest(args);
  return { ok: true, status, etag, data };
}

// ─── Setup ───────────────────────────────────────────────────────────────

export async function bcGetSetup(args?: { companyId?: string }) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("setup/v1.0")}/setup`,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcUpdateSetup(args: {
  setupId: string;
  body: Record<string, unknown>;
  ifMatch?: string;
  companyId?: string;
}) {
  const { data, etag, status } = await banqrBcRequest({
    method: "PATCH",
    path: `${companyPath("setup/v1.0")}/setup(${args.setupId})`,
    body: args.body,
    ifMatch: args.ifMatch ?? "*",
    companyId: args.companyId,
  });
  return { ok: true, status, etag, data };
}

export async function bcSetCertificatePassword(args: {
  setupId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("setup/v1.0")}/setup(${args.setupId})/Microsoft.Nav.setCertificatePassword`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcSetClientSecret(args: {
  setupId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("setup/v1.0")}/setup(${args.setupId})/Microsoft.Nav.setClientSecret`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcSetCertificate(args: {
  setupId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("setup/v1.0")}/setup(${args.setupId})/Microsoft.Nav.setCertificate`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcDeleteAllSecrets(args: {
  setupId: string;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("setup/v1.0")}/setup(${args.setupId})/Microsoft.Nav.deleteAllSecrets`,
    body: {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcGetApiCallLog(args?: {
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("setup/v1.0")}/apiCallLog`,
    query: args?.query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcFinapiCreateConnector(args: {
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("setup/v1.0")}/openBankingConnectors`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcFinapiGetAuthPageUrl(args: {
  openBankingConnectorId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("setup/v1.0")}/openBankingConnectors(${args.openBankingConnectorId})/Microsoft.Nav.getOpenBankingAuthPageURL`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcFinapiLoadAccounts(args: {
  openBankingConnectorId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("setup/v1.0")}/openBankingConnectors(${args.openBankingConnectorId})/Microsoft.Nav.loadOpenBankingAccounts`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

// ─── Counterparties ──────────────────────────────────────────────────────

export async function bcListVendors(args?: {
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("recipient/v1.0")}/vendors`,
    query: args?.query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcGetVendor(args: {
  vendorId: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("recipient/v1.0")}/vendors(${args.vendorId})`,
    companyId: args.companyId,
  });
  return { ok: true, data };
}

export async function bcCreateVendor(args: {
  body: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("recipient/v1.0")}/vendors`,
    body: args.body,
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcUpdateVendor(args: {
  vendorId: string;
  body: Record<string, unknown>;
  ifMatch?: string;
  companyId?: string;
}) {
  const { data, status, etag } = await banqrBcRequest({
    method: "PUT",
    path: `${companyPath("recipient/v1.0")}/vendors(${args.vendorId})`,
    body: args.body,
    ifMatch: args.ifMatch ?? "*",
    companyId: args.companyId,
  });
  return { ok: true, status, etag, data };
}

export async function bcDeleteVendor(args: {
  vendorId: string;
  ifMatch?: string;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "DELETE",
    path: `${companyPath("recipient/v1.0")}/vendors(${args.vendorId})`,
    ifMatch: args.ifMatch ?? "*",
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcListCustomers(args?: {
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("recipient/v1.0")}/customers`,
    query: args?.query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcGetCustomer(args: {
  customerId: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("recipient/v1.0")}/customers(${args.customerId})`,
    companyId: args.companyId,
  });
  return { ok: true, data };
}

export async function bcCreateCustomer(args: {
  body: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("recipient/v1.0")}/customers`,
    body: args.body,
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcUpdateCustomer(args: {
  customerId: string;
  body: Record<string, unknown>;
  ifMatch?: string;
  companyId?: string;
}) {
  const { data, status, etag } = await banqrBcRequest({
    method: "PUT",
    path: `${companyPath("recipient/v1.0")}/customers(${args.customerId})`,
    body: args.body,
    ifMatch: args.ifMatch ?? "*",
    companyId: args.companyId,
  });
  return { ok: true, status, etag, data };
}

export async function bcDeleteCustomer(args: {
  customerId: string;
  ifMatch?: string;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "DELETE",
    path: `${companyPath("recipient/v1.0")}/customers(${args.customerId})`,
    ifMatch: args.ifMatch ?? "*",
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

// ─── Accounts / transactions / statements ────────────────────────────────

export async function bcListAccounts(args?: {
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("bankaccounts/v1.1")}/accounts`,
    query: args?.query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcGetAccount(args: {
  accountId: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("bankaccounts/v1.1")}/accounts(${args.accountId})`,
    companyId: args.companyId,
  });
  return { ok: true, data };
}

export async function bcCreateAccount(args: {
  body: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("bankaccounts/v1.1")}/accounts`,
    body: args.body,
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcUpdateAccount(args: {
  accountId: string;
  body: Record<string, unknown>;
  ifMatch?: string;
  companyId?: string;
}) {
  const { data, status, etag } = await banqrBcRequest({
    method: "PATCH",
    path: `${companyPath("bankaccounts/v1.1")}/accounts(${args.accountId})`,
    body: args.body,
    ifMatch: args.ifMatch ?? "*",
    companyId: args.companyId,
  });
  return { ok: true, status, etag, data };
}

export async function bcDeleteAccount(args: {
  accountId: string;
  ifMatch?: string;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "DELETE",
    path: `${companyPath("bankaccounts/v1.1")}/accounts(${args.accountId})`,
    ifMatch: args.ifMatch ?? "*",
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcUpdateFromBank(args: {
  accountId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("bankaccounts/v1.1")}/accounts(${args.accountId})/Microsoft.Nav.updateFromBank`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcCreateBankConfirmation(args: {
  body: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("bankaccounts/v1.1")}/bankconfirmations`,
    body: args.body,
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcGetBankConfirmationPdf(args: {
  confirmationId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("bankaccounts/v1.1")}/bankconfirmations(${args.confirmationId})/Microsoft.Nav.GetStoredPDF`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcCreatePhysicalParentAccount(args: {
  body: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("virtualbankaccounts/v1.1")}/accounts`,
    body: args.body,
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcCreateVirtualAccount(args: {
  parentAccountId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("virtualbankaccounts/v1.1")}/accounts(${args.parentAccountId})/Microsoft.Nav.createVirtualAccountViaAPI`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcODataBatch(args: {
  api: "payment" | "virtualbankaccounts";
  body: unknown;
  companyId?: string;
}) {
  const version = args.api === "payment" ? "payment/v1.0" : "virtualbankaccounts/v1.1";
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `/api/banqr/${version}/$batch`,
    body: args.body,
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcListTransactions(args?: {
  accountNo?: string;
  query?: string;
  companyId?: string;
}) {
  let query = args?.query;
  if (!query && args?.accountNo) {
    const lit = args.accountNo.replace(/'/g, "''");
    query = `$filter=accountNumber eq '${lit}'`;
  }
  const { data } = await banqrBcRequest({
    path: `${companyPath("bankaccounts/v1.1")}/transactions`,
    query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcListStatements(args?: {
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("bankaccounts/v1.1")}/statements`,
    query: args?.query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcCreateStatement(args: {
  body: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("bankaccounts/v1.1")}/statements`,
    body: args.body,
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcGetStatement(args: {
  statementId: string;
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("bankaccounts/v1.1")}/statements(${args.statementId})`,
    query: args.query,
    companyId: args.companyId,
  });
  return { ok: true, data };
}

export async function bcSendStatementToBank(args: {
  statementId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("bankaccounts/v1.1")}/statements(${args.statementId})/Microsoft.Nav.SendRequestToBank`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcLoadCamtXml(args: {
  statementId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("bankaccounts/v1.1")}/statements(${args.statementId})/Microsoft.Nav.getCamtXMLFile`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

// ─── Payments ────────────────────────────────────────────────────────────

export async function bcListPayments(args?: {
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("payment/v1.0")}/payments`,
    query: args?.query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcGetPayment(args: {
  paymentId: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("payment/v1.0")}/payments(${args.paymentId})`,
    companyId: args.companyId,
  });
  return { ok: true, data };
}

export async function bcCreatePayment(args: {
  body: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("payment/v1.0")}/payments`,
    body: args.body,
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcUpdatePayment(args: {
  paymentId: string;
  body: Record<string, unknown>;
  ifMatch?: string;
  companyId?: string;
}) {
  const { data, status, etag } = await banqrBcRequest({
    method: "PATCH",
    path: `${companyPath("payment/v1.0")}/payments(${args.paymentId})`,
    body: args.body,
    ifMatch: args.ifMatch ?? "*",
    companyId: args.companyId,
  });
  return { ok: true, status, etag, data };
}

export async function bcDeletePayment(args: {
  paymentId: string;
  ifMatch?: string;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "DELETE",
    path: `${companyPath("payment/v1.0")}/payments(${args.paymentId})`,
    ifMatch: args.ifMatch ?? "*",
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcApprovePayment(args: {
  paymentId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("payment/v1.0")}/payments(${args.paymentId})/Microsoft.Nav.approve`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcReopenPayment(args: {
  paymentId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("payment/v1.0")}/payments(${args.paymentId})/Microsoft.Nav.reopen`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcSendPaymentToBank(args: {
  paymentId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("payment/v1.0")}/payments(${args.paymentId})/Microsoft.Nav.sendToBank`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcUpdatePaymentStatusFromBank(args: {
  paymentId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("payment/v1.0")}/payments(${args.paymentId})/Microsoft.Nav.updateStatusFromBank`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcListSepaBics(args?: {
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("payment/v1.0")}/sepaBicDirectories`,
    query: args?.query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcListPurposeCodes(args?: {
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("payment/v1.0")}/purposeCodes`,
    query: args?.query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

// ─── Payment tracker (Swift G4C) ─────────────────────────────────────────

export async function bcCreateG4cSearch(args: {
  body: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("paymenttracker/v1.0")}/searches`,
    body: args.body,
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcListG4cSearches(args?: {
  query?: string;
  companyId?: string;
}) {
  const { data } = await banqrBcRequest({
    path: `${companyPath("paymenttracker/v1.0")}/searches`,
    query: args?.query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}

export async function bcRunG4cSwiftSearch(args: {
  g4cId: string;
  body?: Record<string, unknown>;
  companyId?: string;
}) {
  const { data, status } = await banqrBcRequest({
    method: "POST",
    path: `${companyPath("paymenttracker/v1.0")}/searches(${args.g4cId})/Microsoft.Nav.SwiftNetworkSearch`,
    body: args.body ?? {},
    companyId: args.companyId,
  });
  return { ok: true, status, data };
}

export async function bcListG4cPayments(args?: {
  uetr?: string;
  query?: string;
  companyId?: string;
}) {
  let query =
    args?.query ??
    "$expand=paymentEvents,paymentRemittances";
  if (args?.uetr && !args.query) {
    const lit = args.uetr.replace(/'/g, "''");
    query = `$filter=uetr eq '${lit}'&$expand=paymentEvents,paymentRemittances`;
  }
  const { data } = await banqrBcRequest({
    path: `${companyPath("paymenttracker/v1.0")}/payments`,
    query,
    companyId: args?.companyId,
  });
  return { ok: true, data };
}
