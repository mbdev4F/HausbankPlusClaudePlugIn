export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Live MCP for Claude Cloud:
 * - Hausbank-Agent tools (hausbank_agent_*)
 * - One direct finAPI tool: standalone payment link (customer pays you)
 * CB-Connect / SME / other direct finAPI AIS tools are not exposed.
 */

import * as finapi from "../../../src/operations-finapi";
import {
  banqrBcTools,
  callBanqrBcTool,
  isBanqrBcTool,
} from "../../../src/mcp-tools-banqr";
import {
  oauthEnabled,
  parseBearerSession,
  unauthorizedMcpResponse,
} from "../../../src/oauth/adapter";
import { runWithHausbankSession } from "../../../src/oauth/session";

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
    description: "Connectivity check for the HausbankAgent Claude connector.",
    inputSchema: { type: "object", properties: { message: { type: "string" } } },
  },
  {
    name: "finapi_initiate_standalone_payment",
    description:
      "Create a standalone SEPA payment link (Web Form URL) to send to a customer so they can pay you. Recipient = your IBAN. Customer opens the link, picks their bank, and authorizes. Returns webFormUrl.",
    inputSchema: {
      type: "object",
      properties: {
        recipientName: {
          type: "string",
          description: "Payee name (you / your company)",
        },
        recipientIban: {
          type: "string",
          description: "Payee IBAN (your account that receives the money)",
        },
        recipientBic: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string", default: "EUR" },
        purpose: { type: "string" },
        endToEndId: { type: "string" },
        senderIban: {
          type: "string",
          description: "Optional prefill of payer IBAN",
        },
        executionDate: { type: "string", description: "YYYY-MM-DD" },
        instantPayment: { type: "boolean" },
        redirectUrl: { type: "string" },
        callbackUrl: { type: "string" },
      },
      required: ["recipientName", "recipientIban", "amount"],
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
      serverInfo: {
        name: "HausbankAgent",
        title: "HausbankAgent",
        version: "0.3.0",
      },
      instructions:
        "This connector is HausbankAgent. After Entra OAuth, tenant is fixed; environment/company were set at login. Use hausbank_agent_* tools. Only direct finAPI tool: finapi_initiate_standalone_payment (customer payment link). Never say Business Central / DB / CB-Connect.",
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
    if (oauthEnabled()) {
      const session = parseBearerSession(req);
      if (!session) {
        return unauthorizedMcpResponse();
      }
      const message = await req.json();
      return await runWithHausbankSession(session, () =>
        handleMessage(message),
      );
    }

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

export async function GET(req: Request) {
  if (oauthEnabled()) {
    const session = parseBearerSession(req);
    if (!session) return unauthorizedMcpResponse();
  }
  return new Response("Method Not Allowed", { status: 405 });
}

export async function DELETE() {
  return new Response(null, { status: 405 });
}
