import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HausbankApiClient } from "../clients/hausbank.js";

function json(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

const readOnly = { readOnlyHint: true, destructiveHint: false } as const;
const destructive = { readOnlyHint: false, destructiveHint: true } as const;

export function registerTools(server: McpServer, api: HausbankApiClient) {
  server.tool(
    "list_global_accounts",
    "List accounts in the Deutsche Bank / Hausbank Plus global setup (incl. Postbank First where entitled).",
    {
      entityId: z.string().optional().describe("Legal entity or customer id filter"),
      currency: z.string().optional().describe("ISO currency filter, e.g. EUR"),
    },
    readOnly,
    async (args) => json(await api.listGlobalAccounts(args)),
  );

  server.tool(
    "get_realtime_balance",
    "Fetch realtime booked/available balance for one or more accounts.",
    {
      accountId: z.string().describe("Account id or IBAN"),
      asOf: z.string().optional().describe("Optional ISO timestamp"),
    },
    readOnly,
    async (args) => json(await api.getRealtimeBalance(args)),
  );

  server.tool(
    "get_account_statement",
    "Retrieve a global account statement for a date range.",
    {
      accountId: z.string(),
      dateFrom: z.string().describe("ISO date YYYY-MM-DD"),
      dateTo: z.string().describe("ISO date YYYY-MM-DD"),
      format: z.string().optional().describe("e.g. camt.053, json — TBD by API"),
    },
    readOnly,
    async (args) => json(await api.getAccountStatement(args)),
  );

  server.tool(
    "create_zipa_payment",
    "Create a ZIPA payment draft. Does not send to the bank. Requires later VoP and multi-stage approval.",
    {
      debtorAccountId: z.string(),
      creditorName: z.string(),
      creditorIban: z.string(),
      amount: z.number().positive(),
      currency: z.string().default("EUR"),
      remittanceInfo: z.string().optional(),
      executionDate: z.string().optional(),
    },
    destructive,
    async (args) => json(await api.createZipaPayment(args)),
  );

  server.tool(
    "verify_payee",
    "Run Verification of Pay (VoP) for a payment or creditor account/name pair.",
    {
      paymentId: z.string().optional(),
      creditorName: z.string().optional(),
      creditorIban: z.string().optional(),
    },
    readOnly,
    async (args) => json(await api.verifyPayee(args)),
  );

  server.tool(
    "submit_for_approval",
    "Submit a VoP-checked payment into the multi-stage approval workflow.",
    {
      paymentId: z.string(),
      comment: z.string().optional(),
    },
    destructive,
    async (args) => json(await api.submitForApproval(args)),
  );

  server.tool(
    "approve_payment",
    "Approve a payment at a given approval level.",
    {
      paymentId: z.string(),
      approvalLevel: z.number().int().positive().describe("1 = first approver, 2 = second, …"),
      comment: z.string().optional(),
    },
    destructive,
    async (args) => json(await api.approvePayment(args)),
  );

  server.tool(
    "reject_payment",
    "Reject a payment in the approval workflow.",
    {
      paymentId: z.string(),
      approvalLevel: z.number().int().positive().optional(),
      reason: z.string(),
    },
    destructive,
    async (args) => json(await api.rejectPayment(args)),
  );

  server.tool(
    "send_payment_to_bank",
    "Release a fully approved payment to Deutsche Bank. Destructive — requires completed VoP and approvals.",
    {
      paymentId: z.string(),
    },
    destructive,
    async (args) => json(await api.sendPaymentToBank(args)),
  );

  server.tool(
    "get_swift_payment_status",
    "Query global SWIFT status for an executed payment (UETR / payment id / end-to-end id).",
    {
      paymentId: z.string().optional(),
      uetr: z.string().optional(),
      endToEndId: z.string().optional(),
    },
    readOnly,
    async (args) => json(await api.getSwiftPaymentStatus(args)),
  );

  server.tool(
    "initiate_fx_forward",
    "Initiate an FX forward deal. Destructive — requires explicit confirmation in the skill layer.",
    {
      buyCurrency: z.string(),
      sellCurrency: z.string(),
      notional: z.number().positive(),
      notionalCurrency: z.string().describe("Which leg the notional refers to"),
      valueDate: z.string().describe("ISO date"),
      accountId: z.string().optional(),
    },
    destructive,
    async (args) => json(await api.initiateFxForward(args)),
  );

  server.tool(
    "get_fx_forward_status",
    "Get status of an FX forward deal.",
    {
      fxDealId: z.string(),
    },
    readOnly,
    async (args) => json(await api.getFxForwardStatus(args)),
  );

  server.tool(
    "probe_auth_setup",
    "Diagnostics: report which certificate and signing providers are configured (no secrets returned).",
    {},
    readOnly,
    async () => json(await api.probeAuth()),
  );
}
