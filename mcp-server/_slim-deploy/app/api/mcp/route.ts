export const runtime = "nodejs";
export const maxDuration = 60;

import {
  getRealtimeBalance,
  probeAuthSetup,
  probeTokenAndHealth,
} from "../../../lib/balance";
import * as finapi from "../../../src/operations-finapi";
import {
  banqrBcTools,
  callBanqrBcTool,
  isBanqrBcTool,
} from "../../../src/mcp-tools-banqr";

type JsonRpcId = string | number | null;

function ok(id: JsonRpcId, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result });
}

function err(id: JsonRpcId, code: number, message: string, status = 200) {
  return Response.json(
    { jsonrpc: "2.0", id, error: { code, message } },
    { status },
  );
}

function toolResult(data: unknown, isError = false) {
  return {
    isError,
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

const tools = [
  {
    name: "ping",
    description: "Connectivity check for Claude Cloud custom connector.",
    inputSchema: { type: "object", properties: { message: { type: "string" } } },
  },
  {
    name: "probe_auth_setup",
    description:
      "Diagnostics: CB-Connect env credentials and endpoint resolution (no secrets returned).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "probe_token_and_health",
    description:
      "Fetch OAuth token and call account-balance health endpoint (UP expected).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_realtime_balance",
    description:
      "Fetch realtime booked/available balance via Deutsche Bank CB-Connect.",
    inputSchema: {
      type: "object",
      properties: {
        branchIdentifier: {
          type: "string",
          description: "Branch / BIC-like identifier",
        },
        accountCurrency: {
          type: "string",
          description: "Account currency, usually EUR",
          default: "EUR",
        },
        accountIdentifier: {
          type: "string",
          description: "Account number / IBAN as required by API",
        },
      },
      required: ["branchIdentifier", "accountIdentifier"],
    },
  },
  {
    name: "finapi_probe_auth",
    description:
      "Diagnostics: finAPI env credentials + client/user token probe (no secrets returned).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "finapi_provision_user",
    description:
      "Create a finAPI Access user once. Returns id+password to store as FINAPI_USER_ID / FINAPI_USER_PASSWORD.",
    inputSchema: {
      type: "object",
      properties: {
        preferredUserId: {
          type: "string",
          description: "Optional preferred Access user id",
        },
      },
    },
  },
  {
    name: "finapi_start_bank_connection",
    description:
      "Start finAPI bankConnectionImport Web Form 2.0. Returns URL for human SCA in browser.",
    inputSchema: {
      type: "object",
      properties: {
        callbackUrl: { type: "string" },
        accountTypes: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "finapi_get_webform_status",
    description: "Poll finAPI Web Form 2.0 status (bank connect or payment).",
    inputSchema: {
      type: "object",
      properties: { webFormId: { type: "string" } },
      required: ["webFormId"],
    },
  },
  {
    name: "finapi_list_bank_connections",
    description: "List finAPI bank connections for the configured Access user.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "finapi_list_accounts",
    description: "List finAPI accounts (with balances) and bank connections.",
    inputSchema: {
      type: "object",
      properties: {
        bankConnectionIds: { type: "array", items: { type: "number" } },
      },
    },
  },
  {
    name: "finapi_list_transactions",
    description:
      "List AIS transactions for a finAPI account (JSON bank view, not CAMT). See finAPI Access Transactions.",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          description: "finAPI account id or finapi:{id}",
          oneOf: [{ type: "string" }, { type: "number" }],
        },
        page: { type: "number" },
        perPage: { type: "number" },
      },
      required: ["accountId"],
    },
  },
  {
    name: "finapi_initiate_standalone_payment",
    description:
      "Initiate standalone SEPA payment Web Form 2.0 (payer picks bank/account). Destructive. Returns webFormUrl for SCA.",
    inputSchema: {
      type: "object",
      properties: {
        recipientName: { type: "string" },
        recipientIban: { type: "string" },
        recipientBic: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string", default: "EUR" },
        purpose: { type: "string" },
        endToEndId: { type: "string" },
        senderIban: { type: "string" },
        executionDate: { type: "string", description: "YYYY-MM-DD" },
        instantPayment: { type: "boolean" },
        redirectUrl: { type: "string" },
        callbackUrl: { type: "string" },
      },
      required: ["recipientName", "recipientIban", "amount"],
    },
  },
  {
    name: "finapi_initiate_sepa_payment",
    description:
      "Initiate SEPA payment via finAPI paymentWithAccountId Web Form. Returns URL for SCA. Destructive.",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          description: "Debtor finAPI account id or finapi:{id}",
          oneOf: [{ type: "string" }, { type: "number" }],
        },
        recipientName: { type: "string" },
        recipientIban: { type: "string" },
        recipientBic: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string", default: "EUR" },
        purpose: { type: "string" },
        endToEndId: { type: "string" },
        senderName: { type: "string" },
        executionDate: { type: "string", description: "YYYY-MM-DD" },
        instantPayment: { type: "boolean" },
        verifyPayees: { type: "boolean" },
        redirectUrl: { type: "string" },
        callbackUrl: { type: "string" },
      },
      required: ["accountId", "recipientName", "recipientIban", "amount"],
    },
  },
  {
    name: "finapi_get_payment_status",
    description: "Query finAPI Access API payment status by payment id(s).",
    inputSchema: {
      type: "object",
      properties: {
        paymentIds: { type: "array", items: { type: "number" }, minItems: 1 },
      },
      required: ["paymentIds"],
    },
  },
  ...banqrBcTools,
];

async function handleMessage(message: {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
}) {
  const id = message.id ?? null;
  const method = message.method;

  if (!method) {
    return err(id, -32600, "Invalid Request: missing method");
  }

  if (message.id === undefined && method.startsWith("notifications/")) {
    return new Response(null, { status: 202 });
  }

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "db-cb-connect", version: "0.2.1" },
    });
  }

  if (method === "ping") {
    return ok(id, {});
  }

  if (method === "tools/list") {
    return ok(id, { tools });
  }

  if (method === "tools/call") {
    const name = String(message.params?.name ?? "");
    const args = (message.params?.arguments ?? {}) as Record<string, unknown>;

    try {
      if (name === "ping") {
        const messageText =
          typeof args.message === "string" ? args.message : "pong";
        return ok(id, toolResult({ ok: true, echo: messageText }));
      }
      if (name === "probe_auth_setup") {
        return ok(id, toolResult(await probeAuthSetup()));
      }
      if (name === "probe_token_and_health") {
        return ok(id, toolResult(await probeTokenAndHealth()));
      }
      if (name === "get_realtime_balance") {
        const branchIdentifier = String(args.branchIdentifier ?? "");
        const accountIdentifier = String(args.accountIdentifier ?? "");
        const accountCurrency = String(args.accountCurrency ?? "EUR");
        if (!branchIdentifier || !accountIdentifier) {
          return ok(
            id,
            toolResult(
              { error: "branchIdentifier and accountIdentifier are required" },
              true,
            ),
          );
        }
        return ok(
          id,
          toolResult(
            await getRealtimeBalance({
              branchIdentifier,
              accountCurrency,
              accountIdentifier,
            }),
          ),
        );
      }
      if (name === "finapi_probe_auth") {
        return ok(id, toolResult(await finapi.finapiProbeAuth()));
      }
      if (name === "finapi_provision_user") {
        const preferredUserId =
          typeof args.preferredUserId === "string"
            ? args.preferredUserId
            : undefined;
        return ok(
          id,
          toolResult(await finapi.finapiProvisionUser(preferredUserId)),
        );
      }
      if (name === "finapi_start_bank_connection") {
        return ok(
          id,
          toolResult(
            await finapi.finapiStartBankConnection({
              callbackUrl:
                typeof args.callbackUrl === "string"
                  ? args.callbackUrl
                  : undefined,
              accountTypes: Array.isArray(args.accountTypes)
                ? (args.accountTypes as string[])
                : undefined,
            }),
          ),
        );
      }
      if (name === "finapi_get_webform_status") {
        return ok(
          id,
          toolResult(
            await finapi.finapiGetWebformStatus({
              webFormId: String(args.webFormId ?? ""),
            }),
          ),
        );
      }
      if (name === "finapi_list_bank_connections") {
        return ok(id, toolResult(await finapi.finapiListBankConnections()));
      }
      if (name === "finapi_list_accounts") {
        return ok(
          id,
          toolResult(
            await finapi.finapiListAccounts({
              bankConnectionIds: Array.isArray(args.bankConnectionIds)
                ? (args.bankConnectionIds as number[])
                : undefined,
            }),
          ),
        );
      }
      if (name === "finapi_list_transactions") {
        if (args.accountId === undefined || args.accountId === null) {
          return ok(id, toolResult({ error: "accountId is required" }, true));
        }
        return ok(
          id,
          toolResult(
            await finapi.finapiListTransactions({
              accountId: args.accountId as string | number,
              page: typeof args.page === "number" ? args.page : undefined,
              perPage:
                typeof args.perPage === "number" ? args.perPage : undefined,
            }),
          ),
        );
      }
      if (name === "finapi_initiate_standalone_payment") {
        const recipientName = String(args.recipientName ?? "");
        const recipientIban = String(args.recipientIban ?? "");
        const amount = Number(args.amount);
        if (!recipientName || !recipientIban || !(amount > 0)) {
          return ok(
            id,
            toolResult(
              {
                error:
                  "recipientName, recipientIban and positive amount are required",
              },
              true,
            ),
          );
        }
        return ok(
          id,
          toolResult(
            await finapi.finapiInitiateStandalonePayment({
              recipientName,
              recipientIban,
              recipientBic:
                typeof args.recipientBic === "string"
                  ? args.recipientBic
                  : undefined,
              amount,
              currency:
                typeof args.currency === "string" ? args.currency : "EUR",
              purpose:
                typeof args.purpose === "string" ? args.purpose : undefined,
              endToEndId:
                typeof args.endToEndId === "string"
                  ? args.endToEndId
                  : undefined,
              senderIban:
                typeof args.senderIban === "string"
                  ? args.senderIban
                  : undefined,
              executionDate:
                typeof args.executionDate === "string"
                  ? args.executionDate
                  : undefined,
              instantPayment:
                typeof args.instantPayment === "boolean"
                  ? args.instantPayment
                  : undefined,
              redirectUrl:
                typeof args.redirectUrl === "string"
                  ? args.redirectUrl
                  : undefined,
              callbackUrl:
                typeof args.callbackUrl === "string"
                  ? args.callbackUrl
                  : undefined,
            }),
          ),
        );
      }
      if (name === "finapi_initiate_sepa_payment") {
        const recipientName = String(args.recipientName ?? "");
        const recipientIban = String(args.recipientIban ?? "");
        const amount = Number(args.amount);
        if (
          args.accountId === undefined ||
          args.accountId === null ||
          !recipientName ||
          !recipientIban ||
          !(amount > 0)
        ) {
          return ok(
            id,
            toolResult(
              {
                error:
                  "accountId, recipientName, recipientIban and positive amount are required",
              },
              true,
            ),
          );
        }
        return ok(
          id,
          toolResult(
            await finapi.finapiInitiateSepaPayment({
              accountId: args.accountId as string | number,
              recipientName,
              recipientIban,
              recipientBic:
                typeof args.recipientBic === "string"
                  ? args.recipientBic
                  : undefined,
              amount,
              currency:
                typeof args.currency === "string" ? args.currency : "EUR",
              purpose:
                typeof args.purpose === "string" ? args.purpose : undefined,
              endToEndId:
                typeof args.endToEndId === "string"
                  ? args.endToEndId
                  : undefined,
              senderName:
                typeof args.senderName === "string"
                  ? args.senderName
                  : undefined,
              executionDate:
                typeof args.executionDate === "string"
                  ? args.executionDate
                  : undefined,
              instantPayment:
                typeof args.instantPayment === "boolean"
                  ? args.instantPayment
                  : undefined,
              verifyPayees:
                typeof args.verifyPayees === "boolean"
                  ? args.verifyPayees
                  : undefined,
              redirectUrl:
                typeof args.redirectUrl === "string"
                  ? args.redirectUrl
                  : undefined,
              callbackUrl:
                typeof args.callbackUrl === "string"
                  ? args.callbackUrl
                  : undefined,
            }),
          ),
        );
      }
      if (name === "finapi_get_payment_status") {
        const paymentIds = Array.isArray(args.paymentIds)
          ? (args.paymentIds as number[])
          : [];
        if (!paymentIds.length) {
          return ok(
            id,
            toolResult({ error: "paymentIds must be a non-empty array" }, true),
          );
        }
        return ok(
          id,
          toolResult(await finapi.finapiGetPaymentStatus({ paymentIds })),
        );
      }

      if (isBanqrBcTool(name)) {
        const result = await callBanqrBcTool(name, args);
        if (result === null) {
          return ok(id, toolResult(`Unknown tool: ${name}`, true));
        }
        return ok(id, toolResult(result));
      }

      return ok(id, toolResult(`Unknown tool: ${name}`, true));
    } catch (e) {
      return ok(
        id,
        toolResult(
          { error: e instanceof Error ? e.message : String(e) },
          true,
        ),
      );
    }
  }

  return err(id, -32601, `Method not found: ${method}`);
}

export async function POST(req: Request) {
  try {
    const message = await req.json();
    return await handleMessage(message);
  } catch (e) {
    return err(
      null,
      -32700,
      e instanceof Error ? e.message : "Parse error",
      400,
    );
  }
}

export async function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}

export async function DELETE() {
  return new Response(null, { status: 405 });
}
