import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as ops from "../operations.js";
import * as finapi from "../operations-finapi.js";
import * as bp from "../operations-better-payment.js";
import * as sme from "../operations-sme-db.js";

function json(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

async function run(fn: () => Promise<unknown>) {
  try {
    return json(await fn());
  } catch (err) {
    return json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

const readOnly = { readOnlyHint: true, destructiveHint: false } as const;
const destructive = { readOnlyHint: false, destructiveHint: true } as const;

export function registerTools(server: McpServer) {
  server.tool(
    "probe_auth_setup",
    "Diagnostics: CB-Connect env credentials and endpoint resolution (no secrets returned).",
    {},
    readOnly,
    async () => run(() => ops.probeAuthSetup())
  );

  server.tool(
    "probe_token_and_health",
    "Fetch OAuth token and call account-balance health endpoint (UP expected).",
    {},
    readOnly,
    async () => run(() => ops.probeTokenAndHealth())
  );

  server.tool(
    "get_realtime_balance",
    "Fetch realtime booked/available balance via Deutsche Bank CB-Connect.",
    {
      branchIdentifier: z.string().describe("Branch / BIC-like identifier"),
      accountCurrency: z.string().default("EUR"),
      accountIdentifier: z.string().describe("Account number / IBAN as required by API"),
    },
    readOnly,
    async (args) => run(() => ops.getRealtimeBalance(args))
  );

  server.tool(
    "request_account_statement",
    "Request a CB-Connect account statement (CAMT) for a date range. Returns serviceRequestId for load.",
    {
      branchIdentifier: z.string(),
      accountCurrency: z.string().default("EUR"),
      accountIdentifier: z.string(),
      dateFrom: z.string().describe("YYYY-MM-DD"),
      dateTo: z.string().describe("YYYY-MM-DD"),
      statementType: z.enum(["EOD", "INT"]).optional(),
    },
    readOnly,
    async (args) => run(() => ops.requestAccountStatement(args))
  );

  server.tool(
    "load_account_statement",
    "Load a previously requested CB-Connect statement by serviceRequestId (CAMT XML/JSON).",
    {
      serviceRequestId: z.string(),
    },
    readOnly,
    async (args) => run(() => ops.loadAccountStatement(args))
  );

  server.tool(
    "verify_payee",
    "Run Verification of Payee (VoP) against CB-Connect SEPA VoP API.",
    {
      payeeName: z.string(),
      payeeIban: z.string(),
      debtorIban: z.string(),
    },
    readOnly,
    async (args) => run(() => ops.verifyPayee(args))
  );

  server.tool(
    "initiate_instant_payment",
    "Initiate a SEPA Instant Transfer (SEPA-equivalent) via CB-Connect. Destructive.",
    {
      debtorName: z.string(),
      debtorIban: z.string(),
      debtorBic: z.string(),
      creditorName: z.string(),
      creditorIban: z.string(),
      creditorBic: z.string(),
      amount: z.number().positive(),
      currency: z.string().default("EUR"),
      remittanceInfo: z.string().optional(),
      executionDate: z.string().optional(),
    },
    destructive,
    async (args) => run(() => ops.initiateInstantPayment(args))
  );

  server.tool(
    "get_instant_payment_status",
    "Query SEPA Instant Transfer status by debtor IBAN + endToEndIdentification.",
    {
      debtorIban: z.string(),
      endToEndIdentification: z.string(),
    },
    readOnly,
    async (args) => run(() => ops.getInstantPaymentStatus(args))
  );

  server.tool(
    "get_swift_payment_status",
    "Query SWIFT GPI for Corporates payment status (UETR or time-window search).",
    {
      scenario: z.enum(["uetr", "timeWindowNext", "timeWindowCreditor"]).optional(),
      uetr: z.string().optional(),
      branchIdentifier: z.string().optional(),
      clientBic: z.string().optional(),
      accountIdentifier: z.string().optional(),
      serviceLevel: z.string().optional(),
      startDateTime: z.string().optional(),
      endDateTime: z.string().optional(),
      creditorAccount: z.string().optional(),
      maximumNumber: z.string().optional(),
      next: z.string().optional(),
    },
    readOnly,
    async (args) => run(() => ops.getSwiftPaymentStatus(args))
  );

  server.tool(
    "initiate_fx4cash",
    "Initiate a CB-Connect FX4Cash (cross-border FX-for-cash) payment. Destructive.",
    {
      instructedAmount: z.number().positive().optional(),
      instructedCurrency: z.string().optional(),
      debtorAccountId: z.string().optional(),
      debtorAccountCurrency: z.string().optional(),
      creditorIban: z.string().optional(),
      creditorName: z.string().optional(),
      endToEndIdentification: z.string().optional(),
      requestedExecutionDate: z.string().optional(),
    },
    destructive,
    async (args) => run(() => ops.initiateFx4Cash(args))
  );

  server.tool(
    "get_fx4cash_status",
    "Get FX4Cash payment status report (requires debtor IBAN + endToEndIdentification).",
    {
      debtorIban: z.string(),
      endToEndIdentification: z.string(),
    },
    readOnly,
    async (args) => run(() => ops.getFx4CashStatus(args))
  );

  server.tool(
    "evaluate_fx4cash_value_date",
    "Evaluate FX4Cash value date before initiation.",
    {
      accountNumber: z.string(),
      currencyPair: z.string().describe("e.g. EURUSD"),
      suggestedValueDate: z.string().describe("YYYY-MM-DD"),
    },
    readOnly,
    async (args) => run(() => ops.evaluateFx4CashValueDate(args))
  );

  // ─── finAPI (Open Banking / Multibank) ─────────────────────────────────

  server.tool(
    "finapi_probe_auth",
    "Diagnostics: finAPI env credentials + client/user token probe (no secrets returned).",
    {},
    readOnly,
    async () => run(() => finapi.finapiProbeAuth())
  );

  server.tool(
    "finapi_provision_user",
    "Create a finAPI Access user once. Returns id+password to store as FINAPI_USER_ID / FINAPI_USER_PASSWORD.",
    {
      preferredUserId: z
        .string()
        .optional()
        .describe("Optional preferred Access user id"),
    },
    destructive,
    async (args) => run(() => finapi.finapiProvisionUser(args.preferredUserId))
  );

  server.tool(
    "finapi_list_bank_connections",
    "List finAPI bank connections for the configured Access user.",
    {},
    readOnly,
    async () => run(() => finapi.finapiListBankConnections())
  );

  server.tool(
    "finapi_list_accounts",
    "List finAPI accounts (with balances) and bank connections.",
    {
      bankConnectionIds: z
        .array(z.number())
        .optional()
        .describe("Optional filter by bank connection ids"),
    },
    readOnly,
    async (args) => run(() => finapi.finapiListAccounts(args))
  );

  server.tool(
    "finapi_list_transactions",
    "List AIS transactions for a finAPI account (JSON bank view, not CAMT).",
    {
      accountId: z
        .union([z.string(), z.number()])
        .describe("finAPI account id or finapi:{id}"),
      page: z.number().int().positive().optional(),
      perPage: z.number().int().positive().max(500).optional(),
    },
    readOnly,
    async (args) => run(() => finapi.finapiListTransactions(args))
  );

  server.tool(
    "finapi_start_bank_connection",
    "Start finAPI bankConnectionImport Web Form 2.0. Returns URL for human SCA in browser.",
    {
      callbackUrl: z.string().url().optional(),
      accountTypes: z.array(z.string()).optional(),
    },
    destructive,
    async (args) => run(() => finapi.finapiStartBankConnection(args))
  );

  server.tool(
    "finapi_get_webform_status",
    "Poll finAPI Web Form 2.0 status (bank connect or payment).",
    {
      webFormId: z.string(),
    },
    readOnly,
    async (args) => run(() => finapi.finapiGetWebformStatus(args))
  );

  server.tool(
    "finapi_initiate_sepa_payment",
    "Initiate SEPA payment via finAPI paymentWithAccountId Web Form. Returns URL for SCA. Destructive.",
    {
      accountId: z
        .union([z.string(), z.number()])
        .describe("Debtor finAPI account id or finapi:{id}"),
      recipientName: z.string(),
      recipientIban: z.string(),
      recipientBic: z.string().optional(),
      amount: z.number().positive(),
      currency: z.string().default("EUR"),
      purpose: z.string().optional(),
      endToEndId: z.string().optional(),
      senderName: z.string().optional(),
      executionDate: z.string().optional().describe("YYYY-MM-DD"),
      instantPayment: z.boolean().optional(),
      verifyPayees: z.boolean().optional(),
      redirectUrl: z.string().url().optional(),
      callbackUrl: z.string().url().optional(),
    },
    destructive,
    async (args) => run(() => finapi.finapiInitiateSepaPayment(args))
  );

  server.tool(
    "finapi_get_payment_status",
    "Query finAPI Access API payment status by payment id(s).",
    {
      paymentIds: z.array(z.number()).min(1),
    },
    readOnly,
    async (args) => run(() => finapi.finapiGetPaymentStatus(args))
  );

  // ─── Better Payment (Wero + Pay by Bank) ───────────────────────────────

  server.tool(
    "better_payment_probe_auth",
    "Diagnostics: Better Payment env credentials + auth smoke test (no secrets returned).",
    {},
    readOnly,
    async () => run(() => bp.betterPaymentProbe())
  );

  server.tool(
    "list_payment_methods",
    "List Better Payment methods available for payment links: Wero and Pay by Bank (RTP).",
    {},
    readOnly,
    async () => run(async () => bp.betterPaymentListMethods())
  );

  server.tool(
    "create_payment_link",
    "Create a Better Payment checkout link for Wero or Pay by Bank (RTP). Returns paymentLinkUrl for the payer. Destructive.",
    {
      method: z
        .string()
        .describe(
          'Payment method: "wero" (alias "vero") or "pay_by_bank" / "rtp"'
        ),
      amount: z
        .number()
        .positive()
        .describe("Amount in major units, e.g. 12.5 for EUR 12.50"),
      currency: z.string().default("EUR"),
      reference: z
        .string()
        .optional()
        .describe("Order / reconciliation id (auto-generated if omitted)"),
      merchantReference: z.string().optional(),
      debtorName: z
        .string()
        .optional()
        .describe("Full name; split into first/last if those are omitted"),
      debtorEmail: z.string().email().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().default("DE"),
      successUrl: z
        .string()
        .url()
        .optional()
        .describe("HTTPS success URL (or set BETTER_PAYMENT_PUBLIC_ORIGIN)"),
      errorUrl: z.string().url().optional(),
      postbackUrl: z.string().url().optional(),
      weroCheckoutUrl: z
        .string()
        .url()
        .optional()
        .describe("Required for Wero if not using successUrl / public origin"),
    },
    destructive,
    async (args) => run(() => bp.createPaymentLink(args))
  );

  server.tool(
    "get_payment_link_status",
    "Query Better Payment transaction status by transactionId and/or orderId.",
    {
      transactionId: z.string().optional(),
      orderId: z.string().optional(),
    },
    readOnly,
    async (args) => run(() => bp.getPaymentLinkStatus(args))
  );

  // ─── SME Deutsche Bank Connector (Biz-Banking / Business Connector) ───

  server.tool(
    "sme_db_probe_auth",
    "Diagnostics: SME Deutsche Bank Connector env + OAuth refresh (legacy). Prefer separate BizBankingConnect for Claude OAuth.",
    {},
    readOnly,
    async () => run(() => sme.smeDbProbeAuth())
  );

  server.tool(
    "sme_db_oauth_start",
    "Legacy OAuth start for SME Deutsche Bank (env refresh). Prefer BizBankingConnect Claude connector.",
    {
      redirectUri: z.string().url().optional(),
      probe: z
        .boolean()
        .optional()
        .describe("Probe authorize reachability before returning (default true)"),
    },
    readOnly,
    async (args) => run(() => sme.smeDbOauthStart(args))
  );

  server.tool(
    "sme_db_oauth_complete",
    "Legacy: exchange code; may return refreshToken for SME_DB_REFRESH_TOKEN. Prefer BizBankingConnect.",
    {
      code: z.string(),
      redirectUri: z.string().url().optional(),
    },
    destructive,
    async (args) => run(() => sme.smeDbOauthComplete(args))
  );

  server.tool(
    "sme_db_list_accounts",
    "List cash accounts + balances via SME Deutsche Bank Connector (api.db.com / simulator).",
    {},
    readOnly,
    async () => run(() => sme.smeDbListAccounts())
  );

  server.tool(
    "sme_db_list_transactions",
    "List AIS transactions for an IBAN via SME Deutsche Bank Connector.",
    {
      iban: z.string(),
      limit: z.number().int().positive().max(500).optional(),
      bookingDateFrom: z.string().optional().describe("YYYY-MM-DD"),
    },
    readOnly,
    async (args) => run(() => sme.smeDbListTransactions(args))
  );

  server.tool(
    "sme_db_check_instant_reachability",
    "Check whether creditor IBAN is reachable for Instant SEPA via SME Deutsche Bank Connector.",
    {
      creditorIban: z.string(),
    },
    readOnly,
    async (args) => run(() => sme.smeDbInstantReachability(args))
  );

  server.tool(
    "sme_db_list_sca_methods",
    "List active SCA methods (PHOTOTAN / MTAN / PUSHTAN) for SME Deutsche Bank Instant payments.",
    {},
    readOnly,
    async () => run(() => sme.smeDbListScaMethodsOp())
  );

  server.tool(
    "sme_db_start_sca_challenge",
    "Start SCA challenge for Instant SEPA (returns challenge id / photo / phone).",
    {
      method: z.string().describe("PHOTOTAN | MTAN | PUSHTAN"),
      amount: z.number().positive(),
      currency: z.string().default("EUR"),
      targetIban: z.string(),
      language: z.string().optional(),
    },
    destructive,
    async (args) => run(() => sme.smeDbStartScaChallengeOp(args))
  );

  server.tool(
    "sme_db_complete_sca_challenge",
    "Submit TAN / challenge response and receive challengeProofToken for payment otp header.",
    {
      challengeId: z.string(),
      tan: z.string(),
    },
    destructive,
    async (args) => run(() => sme.smeDbCompleteScaChallengeOp(args))
  );

  server.tool(
    "sme_db_initiate_instant_payment",
    "Initiate Instant SEPA credit transfer via SME Deutsche Bank Connector. Requires otp (proof token or PUSHTAN). Destructive.",
    {
      debtorIban: z.string(),
      creditorName: z.string(),
      creditorIban: z.string(),
      amount: z.number().positive(),
      currency: z.string().default("EUR"),
      endToEndIdentification: z.string().optional(),
      remittanceInformationUnstructured: z.string().optional(),
      otp: z
        .string()
        .describe("challengeProofToken from SCA, or PUSHTAN"),
    },
    destructive,
    async (args) => run(() => sme.smeDbInitiateInstantPaymentOp(args))
  );

  server.tool(
    "sme_db_get_payment_status",
    "Get Instant SEPA payment status by paymentId (SME Deutsche Bank Connector).",
    {
      paymentId: z.string(),
    },
    readOnly,
    async (args) => run(() => sme.smeDbGetPaymentStatusOp(args))
  );

  server.tool(
    "sme_db_list_credit_cards",
    "List credit cards via SME Deutsche Bank Connector.",
    {},
    readOnly,
    async () => run(() => sme.smeDbListCreditCards())
  );
}
