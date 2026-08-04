/**
 * Hausbank-Agent MCP tools (CloudConnector APIs).
 * User-facing name: always "Hausbank-Agent".
 * Tool names: hausbank_agent_* (e.g. hausbank_agent_list_payments).
 */

import * as bc from "./operations-banqr-bc";

type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const companyId = {
  type: "string",
  description: "Optional Hausbank-Agent company GUID (defaults to HAUSBANK_AGENT_COMPANY_ID)",
};

const body = {
  type: "object",
  description: "JSON body for create/update/action",
};

const query = {
  type: "string",
  description: "OData query without leading ?, e.g. $top=20&$select=id,name",
};

export const banqrBcTools: ToolDef[] = [
  {
    name: "hausbank_agent_probe_auth",
    description:
      "Diagnostics: Hausbank-Agent env + client_credentials token (no secrets).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "hausbank_agent_list_companies",
    description: "List Hausbank-Agent companies. Use returned id as companyId.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "hausbank_agent_request",
    description:
      "Low-level Hausbank-Agent API call. Path may include {companyId}. Prefer named hausbank_agent_* tools when possible.",
    inputSchema: {
      type: "object",
      properties: {
        method: { type: "string", description: "GET|POST|PATCH|PUT|DELETE" },
        path: {
          type: "string",
          description:
            "Path under BC env root, e.g. /api/banqr/bankaccounts/v1.1/companies({companyId})/accounts",
        },
        query: query,
        body: body,
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["path"],
    },
  },
  {
    name: "hausbank_agent_get_setup",
    description: "Get Hausbank-Agent setup records.",
    inputSchema: { type: "object", properties: { companyId } },
  },
  {
    name: "hausbank_agent_update_setup",
    description: "PATCH Hausbank-Agent setup by setupId (If-Match default *).",
    inputSchema: {
      type: "object",
      properties: {
        setupId: { type: "string" },
        body,
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["setupId", "body"],
    },
  },
  {
    name: "hausbank_agent_set_certificate_password",
    description: "Bound action setCertificatePassword on setup.",
    inputSchema: {
      type: "object",
      properties: { setupId: { type: "string" }, body, companyId },
      required: ["setupId"],
    },
  },
  {
    name: "hausbank_agent_set_client_secret",
    description: "Bound action setClientSecret on setup.",
    inputSchema: {
      type: "object",
      properties: { setupId: { type: "string" }, body, companyId },
      required: ["setupId"],
    },
  },
  {
    name: "hausbank_agent_set_certificate",
    description: "Bound action setCertificate on setup.",
    inputSchema: {
      type: "object",
      properties: { setupId: { type: "string" }, body, companyId },
      required: ["setupId"],
    },
  },
  {
    name: "hausbank_agent_delete_all_secrets",
    description: "Bound action deleteAllSecrets on setup.",
    inputSchema: {
      type: "object",
      properties: { setupId: { type: "string" }, companyId },
      required: ["setupId"],
    },
  },
  {
    name: "hausbank_agent_get_api_call_log",
    description: "List Hausbank-Agent API call log.",
    inputSchema: { type: "object", properties: { query, companyId } },
  },
  {
    name: "hausbank_agent_finapi_create_connector",
    description: "Create openBankingConnectors (finAPI) setup row in Hausbank-Agent.",
    inputSchema: { type: "object", properties: { body, companyId } },
  },
  {
    name: "hausbank_agent_finapi_get_auth_page_url",
    description: "Get Open Banking auth page URL for a connector.",
    inputSchema: {
      type: "object",
      properties: {
        openBankingConnectorId: { type: "string" },
        body,
        companyId,
      },
      required: ["openBankingConnectorId"],
    },
  },
  {
    name: "hausbank_agent_finapi_load_accounts",
    description: "Load Open Banking accounts into BC for a connector.",
    inputSchema: {
      type: "object",
      properties: {
        openBankingConnectorId: { type: "string" },
        body,
        companyId,
      },
      required: ["openBankingConnectorId"],
    },
  },
  {
    name: "hausbank_agent_list_vendors",
    description: "List vendor counterparties (Hausbank-Agent recipient API).",
    inputSchema: { type: "object", properties: { query, companyId } },
  },
  {
    name: "hausbank_agent_get_vendor",
    description: "Get vendor counterparty by id.",
    inputSchema: {
      type: "object",
      properties: { vendorId: { type: "string" }, companyId },
      required: ["vendorId"],
    },
  },
  {
    name: "hausbank_agent_create_vendor",
    description: "Create vendor counterparty.",
    inputSchema: {
      type: "object",
      properties: { body, companyId },
      required: ["body"],
    },
  },
  {
    name: "hausbank_agent_update_vendor",
    description: "Update vendor (bank details etc.).",
    inputSchema: {
      type: "object",
      properties: {
        vendorId: { type: "string" },
        body,
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["vendorId", "body"],
    },
  },
  {
    name: "hausbank_agent_delete_vendor",
    description: "Delete vendor counterparty.",
    inputSchema: {
      type: "object",
      properties: {
        vendorId: { type: "string" },
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["vendorId"],
    },
  },
  {
    name: "hausbank_agent_list_customers",
    description: "List customer counterparties.",
    inputSchema: { type: "object", properties: { query, companyId } },
  },
  {
    name: "hausbank_agent_get_customer",
    description: "Get customer counterparty by id.",
    inputSchema: {
      type: "object",
      properties: { customerId: { type: "string" }, companyId },
      required: ["customerId"],
    },
  },
  {
    name: "hausbank_agent_create_customer",
    description: "Create customer counterparty.",
    inputSchema: {
      type: "object",
      properties: { body, companyId },
      required: ["body"],
    },
  },
  {
    name: "hausbank_agent_update_customer",
    description: "Update customer counterparty.",
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "string" },
        body,
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["customerId", "body"],
    },
  },
  {
    name: "hausbank_agent_delete_customer",
    description: "Delete customer counterparty.",
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "string" },
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["customerId"],
    },
  },
  {
    name: "hausbank_agent_list_accounts",
    description: "List Hausbank-Agent bank accounts (incl. balances).",
    inputSchema: { type: "object", properties: { query, companyId } },
  },
  {
    name: "hausbank_agent_get_account",
    description: "Get bank account by system id.",
    inputSchema: {
      type: "object",
      properties: { accountId: { type: "string" }, companyId },
      required: ["accountId"],
    },
  },
  {
    name: "hausbank_agent_create_account",
    description: "Create bank account in Hausbank-Agent.",
    inputSchema: {
      type: "object",
      properties: { body, companyId },
      required: ["body"],
    },
  },
  {
    name: "hausbank_agent_update_account",
    description: "PATCH bank account.",
    inputSchema: {
      type: "object",
      properties: {
        accountId: { type: "string" },
        body,
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["accountId", "body"],
    },
  },
  {
    name: "hausbank_agent_delete_account",
    description: "Delete bank account.",
    inputSchema: {
      type: "object",
      properties: {
        accountId: { type: "string" },
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["accountId"],
    },
  },
  {
    name: "hausbank_agent_update_from_bank",
    description:
      "Bound action updateFromBank — refresh balance/transactions from bank into Hausbank-Agent.",
    inputSchema: {
      type: "object",
      properties: { accountId: { type: "string" }, body, companyId },
      required: ["accountId"],
    },
  },
  {
    name: "hausbank_agent_create_bank_confirmation",
    description: "Create bank account confirmation.",
    inputSchema: {
      type: "object",
      properties: { body, companyId },
      required: ["body"],
    },
  },
  {
    name: "hausbank_agent_get_bank_confirmation_pdf",
    description: "Get stored bank confirmation PDF via bound action.",
    inputSchema: {
      type: "object",
      properties: {
        confirmationId: { type: "string" },
        body,
        companyId,
      },
      required: ["confirmationId"],
    },
  },
  {
    name: "hausbank_agent_create_physical_parent_account",
    description: "Create physical parent account (virtual bank accounts API).",
    inputSchema: {
      type: "object",
      properties: { body, companyId },
      required: ["body"],
    },
  },
  {
    name: "hausbank_agent_create_virtual_account",
    description: "Create virtual account under a parent account.",
    inputSchema: {
      type: "object",
      properties: {
        parentAccountId: { type: "string" },
        body,
        companyId,
      },
      required: ["parentAccountId"],
    },
  },
  {
    name: "hausbank_agent_odata_batch",
    description: "POST OData $batch (payment or virtualbankaccounts).",
    inputSchema: {
      type: "object",
      properties: {
        api: { type: "string", enum: ["payment", "virtualbankaccounts"] },
        body: { description: "Batch payload" },
        companyId,
      },
      required: ["api", "body"],
    },
  },
  {
    name: "hausbank_agent_list_transactions",
    description:
      "List Hausbank-Agent transactions. Optional accountNo builds $filter=accountNumber eq '...'.",
    inputSchema: {
      type: "object",
      properties: {
        accountNo: { type: "string" },
        query,
        companyId,
      },
    },
  },
  {
    name: "hausbank_agent_list_statements",
    description: "List statement requests.",
    inputSchema: { type: "object", properties: { query, companyId } },
  },
  {
    name: "hausbank_agent_create_statement",
    description: "Create statement request.",
    inputSchema: {
      type: "object",
      properties: { body, companyId },
      required: ["body"],
    },
  },
  {
    name: "hausbank_agent_get_statement",
    description: "Get statement request / status.",
    inputSchema: {
      type: "object",
      properties: {
        statementId: { type: "string" },
        query,
        companyId,
      },
      required: ["statementId"],
    },
  },
  {
    name: "hausbank_agent_send_statement_to_bank",
    description: "Send statement request to bank.",
    inputSchema: {
      type: "object",
      properties: { statementId: { type: "string" }, body, companyId },
      required: ["statementId"],
    },
  },
  {
    name: "hausbank_agent_load_camt_xml",
    description: "Load CAMT XML for a statement request.",
    inputSchema: {
      type: "object",
      properties: { statementId: { type: "string" }, body, companyId },
      required: ["statementId"],
    },
  },
  {
    name: "hausbank_agent_list_payments",
    description: "List Hausbank-Agent payments.",
    inputSchema: { type: "object", properties: { query, companyId } },
  },
  {
    name: "hausbank_agent_get_payment",
    description: "Get payment by id.",
    inputSchema: {
      type: "object",
      properties: { paymentId: { type: "string" }, companyId },
      required: ["paymentId"],
    },
  },
  {
    name: "hausbank_agent_create_payment",
    description: "Create payment draft.",
    inputSchema: {
      type: "object",
      properties: { body, companyId },
      required: ["body"],
    },
  },
  {
    name: "hausbank_agent_update_payment",
    description: "Update payment draft.",
    inputSchema: {
      type: "object",
      properties: {
        paymentId: { type: "string" },
        body,
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["paymentId", "body"],
    },
  },
  {
    name: "hausbank_agent_delete_payment",
    description: "Delete payment draft.",
    inputSchema: {
      type: "object",
      properties: {
        paymentId: { type: "string" },
        ifMatch: { type: "string" },
        companyId,
      },
      required: ["paymentId"],
    },
  },
  {
    name: "hausbank_agent_approve_payment",
    description: "Approve payment (bound action).",
    inputSchema: {
      type: "object",
      properties: { paymentId: { type: "string" }, body, companyId },
      required: ["paymentId"],
    },
  },
  {
    name: "hausbank_agent_reopen_payment",
    description: "Reopen payment (bound action).",
    inputSchema: {
      type: "object",
      properties: { paymentId: { type: "string" }, body, companyId },
      required: ["paymentId"],
    },
  },
  {
    name: "hausbank_agent_send_payment_to_bank",
    description: "Send payment to bank (bound action).",
    inputSchema: {
      type: "object",
      properties: { paymentId: { type: "string" }, body, companyId },
      required: ["paymentId"],
    },
  },
  {
    name: "hausbank_agent_update_payment_status_from_bank",
    description: "Refresh payment status from bank.",
    inputSchema: {
      type: "object",
      properties: { paymentId: { type: "string" }, body, companyId },
      required: ["paymentId"],
    },
  },
  {
    name: "hausbank_agent_list_sepa_bics",
    description: "List SEPA BIC directory entries.",
    inputSchema: { type: "object", properties: { query, companyId } },
  },
  {
    name: "hausbank_agent_list_purpose_codes",
    description: "List payment purpose codes.",
    inputSchema: { type: "object", properties: { query, companyId } },
  },
  {
    name: "hausbank_agent_create_g4c_search",
    description: "Create Swift G4C payment tracker search request.",
    inputSchema: {
      type: "object",
      properties: { body, companyId },
      required: ["body"],
    },
  },
  {
    name: "hausbank_agent_list_g4c_searches",
    description: "List Swift G4C search requests.",
    inputSchema: { type: "object", properties: { query, companyId } },
  },
  {
    name: "hausbank_agent_run_g4c_swift_search",
    description: "Initiate Swift network search for a G4C search id.",
    inputSchema: {
      type: "object",
      properties: { g4cId: { type: "string" }, body, companyId },
      required: ["g4cId"],
    },
  },
  {
    name: "hausbank_agent_list_g4c_payments",
    description:
      "List G4C tracker payments (optional uetr filter). Expands events/remittances by default.",
    inputSchema: {
      type: "object",
      properties: {
        uetr: { type: "string" },
        query,
        companyId,
      },
    },
  },
];

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function obj(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

export async function callBanqrBcTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  let tool = name;
  if (name.startsWith("hausbank_agent_")) tool = name;
  else if (name.startsWith("hb365_")) tool = "hausbank_agent_" + name.slice(6);
  else if (name.startsWith("bc_")) tool = "hausbank_agent_" + name.slice(3);
  switch (tool) {
    case "hausbank_agent_probe_auth":
      return bc.bcProbeAuth();
    case "hausbank_agent_list_companies":
      return bc.bcListCompanies();
    case "hausbank_agent_request":
      return bc.bcRequest({
        method: str(args.method),
        path: String(args.path ?? ""),
        query: str(args.query),
        body: args.body,
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_get_setup":
      return bc.bcGetSetup({ companyId: str(args.companyId) });
    case "hausbank_agent_update_setup":
      return bc.bcUpdateSetup({
        setupId: String(args.setupId ?? ""),
        body: obj(args.body) ?? {},
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_set_certificate_password":
      return bc.bcSetCertificatePassword({
        setupId: String(args.setupId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_set_client_secret":
      return bc.bcSetClientSecret({
        setupId: String(args.setupId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_set_certificate":
      return bc.bcSetCertificate({
        setupId: String(args.setupId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_delete_all_secrets":
      return bc.bcDeleteAllSecrets({
        setupId: String(args.setupId ?? ""),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_get_api_call_log":
      return bc.bcGetApiCallLog({
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_finapi_create_connector":
      return bc.bcFinapiCreateConnector({
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_finapi_get_auth_page_url":
      return bc.bcFinapiGetAuthPageUrl({
        openBankingConnectorId: String(args.openBankingConnectorId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_finapi_load_accounts":
      return bc.bcFinapiLoadAccounts({
        openBankingConnectorId: String(args.openBankingConnectorId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_vendors":
      return bc.bcListVendors({
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_get_vendor":
      return bc.bcGetVendor({
        vendorId: String(args.vendorId ?? ""),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_create_vendor":
      return bc.bcCreateVendor({
        body: obj(args.body) ?? {},
        companyId: str(args.companyId),
      });
    case "hausbank_agent_update_vendor":
      return bc.bcUpdateVendor({
        vendorId: String(args.vendorId ?? ""),
        body: obj(args.body) ?? {},
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_delete_vendor":
      return bc.bcDeleteVendor({
        vendorId: String(args.vendorId ?? ""),
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_customers":
      return bc.bcListCustomers({
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_get_customer":
      return bc.bcGetCustomer({
        customerId: String(args.customerId ?? ""),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_create_customer":
      return bc.bcCreateCustomer({
        body: obj(args.body) ?? {},
        companyId: str(args.companyId),
      });
    case "hausbank_agent_update_customer":
      return bc.bcUpdateCustomer({
        customerId: String(args.customerId ?? ""),
        body: obj(args.body) ?? {},
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_delete_customer":
      return bc.bcDeleteCustomer({
        customerId: String(args.customerId ?? ""),
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_accounts":
      return bc.bcListAccounts({
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_get_account":
      return bc.bcGetAccount({
        accountId: String(args.accountId ?? ""),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_create_account":
      return bc.bcCreateAccount({
        body: obj(args.body) ?? {},
        companyId: str(args.companyId),
      });
    case "hausbank_agent_update_account":
      return bc.bcUpdateAccount({
        accountId: String(args.accountId ?? ""),
        body: obj(args.body) ?? {},
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_delete_account":
      return bc.bcDeleteAccount({
        accountId: String(args.accountId ?? ""),
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_update_from_bank":
      return bc.bcUpdateFromBank({
        accountId: String(args.accountId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_create_bank_confirmation":
      return bc.bcCreateBankConfirmation({
        body: obj(args.body) ?? {},
        companyId: str(args.companyId),
      });
    case "hausbank_agent_get_bank_confirmation_pdf":
      return bc.bcGetBankConfirmationPdf({
        confirmationId: String(args.confirmationId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_create_physical_parent_account":
      return bc.bcCreatePhysicalParentAccount({
        body: obj(args.body) ?? {},
        companyId: str(args.companyId),
      });
    case "hausbank_agent_create_virtual_account":
      return bc.bcCreateVirtualAccount({
        parentAccountId: String(args.parentAccountId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_odata_batch":
      return bc.bcODataBatch({
        api: args.api === "virtualbankaccounts" ? "virtualbankaccounts" : "payment",
        body: args.body,
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_transactions":
      return bc.bcListTransactions({
        accountNo: str(args.accountNo),
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_statements":
      return bc.bcListStatements({
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_create_statement":
      return bc.bcCreateStatement({
        body: obj(args.body) ?? {},
        companyId: str(args.companyId),
      });
    case "hausbank_agent_get_statement":
      return bc.bcGetStatement({
        statementId: String(args.statementId ?? ""),
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_send_statement_to_bank":
      return bc.bcSendStatementToBank({
        statementId: String(args.statementId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_load_camt_xml":
      return bc.bcLoadCamtXml({
        statementId: String(args.statementId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_payments":
      return bc.bcListPayments({
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_get_payment":
      return bc.bcGetPayment({
        paymentId: String(args.paymentId ?? ""),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_create_payment":
      return bc.bcCreatePayment({
        body: obj(args.body) ?? {},
        companyId: str(args.companyId),
      });
    case "hausbank_agent_update_payment":
      return bc.bcUpdatePayment({
        paymentId: String(args.paymentId ?? ""),
        body: obj(args.body) ?? {},
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_delete_payment":
      return bc.bcDeletePayment({
        paymentId: String(args.paymentId ?? ""),
        ifMatch: str(args.ifMatch),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_approve_payment":
      return bc.bcApprovePayment({
        paymentId: String(args.paymentId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_reopen_payment":
      return bc.bcReopenPayment({
        paymentId: String(args.paymentId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_send_payment_to_bank":
      return bc.bcSendPaymentToBank({
        paymentId: String(args.paymentId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_update_payment_status_from_bank":
      return bc.bcUpdatePaymentStatusFromBank({
        paymentId: String(args.paymentId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_sepa_bics":
      return bc.bcListSepaBics({
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_purpose_codes":
      return bc.bcListPurposeCodes({
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_create_g4c_search":
      return bc.bcCreateG4cSearch({
        body: obj(args.body) ?? {},
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_g4c_searches":
      return bc.bcListG4cSearches({
        query: str(args.query),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_run_g4c_swift_search":
      return bc.bcRunG4cSwiftSearch({
        g4cId: String(args.g4cId ?? ""),
        body: obj(args.body),
        companyId: str(args.companyId),
      });
    case "hausbank_agent_list_g4c_payments":
      return bc.bcListG4cPayments({
        uetr: str(args.uetr),
        query: str(args.query),
        companyId: str(args.companyId),
      });
    default:
      return null;
  }
}

export function isBanqrBcTool(name: string): boolean {
  return name.startsWith("hausbank_agent_") || name.startsWith("hb365_") || name.startsWith("bc_");
}
