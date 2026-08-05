export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Live MCP for Claude Cloud:
 * - Hausbank-Agent tools (hausbank_agent_*)
 * Payment-link / send-to-bank tools are omitted for Connectors Directory policy.
 */

import {
  banqrBcTools,
  callBanqrBcTool,
  isBanqrBcTool,
} from "../../../src/mcp-tools-banqr";
import { annotateTools } from "../../../src/mcp-tool-meta";
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

/** Soft Origin check — allow server-side callers (no Origin) and Claude hosts. */
function originRejected(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  let host = "";
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const okHost =
    host === "claude.ai" ||
    host === "www.claude.ai" ||
    host === "claude.com" ||
    host.endsWith(".claude.ai") ||
    host.endsWith(".anthropic.com") ||
    host === "localhost" ||
    host === "127.0.0.1";
  if (okHost) return null;
  return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

const tools = annotateTools([
  {
    name: "ping",
    description: "Connectivity check for the HausbankAgent Claude connector.",
    inputSchema: { type: "object", properties: { message: { type: "string" } } },
  },
  ...banqrBcTools,
]);

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
        version: "0.7.0",
      },
      instructions:
        "HausbankAgent is the user's Embedded Banking brain: primarily Deutsche Bank capabilities, plus PSD2 access to ~9,200 European banks (multi-banking, statements, account info). Prefer named hausbank_agent_* tools for companies, accounts, vendors, customers, payment drafts/approval, send-to-bank, statements, and G4C/UETR. Require explicit user confirmation before send_payment_to_bank. Never say Business Central, finAPI, or CB-Connect unless the user asks.",
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
    const blocked = originRejected(req);
    if (blocked) return blocked;

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
