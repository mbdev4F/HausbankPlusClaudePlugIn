import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as ops from "../operations.js";

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
    "Initiate a SEPA Instant Transfer (ZIPA-equivalent) via CB-Connect. Destructive.",
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
}
