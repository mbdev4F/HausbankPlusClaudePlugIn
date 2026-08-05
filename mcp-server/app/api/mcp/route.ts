import { createMcpHandler } from "mcp-handler";
import { registerTools } from "@/src/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const mcpHandler = createMcpHandler(
  (server) => {
    registerTools(server);
  },
  {
    serverInfo: {
      name: "HausbankAgent",
      version: "0.7.0",
    },
    instructions:
      "HausbankAgent is the user's Embedded Banking brain: primarily Deutsche Bank capabilities, plus PSD2 access to ~9,200 European banks. Prefer named hausbank_agent_* tools for companies, accounts, vendors, customers, payment drafts/approval, statements, and G4C/UETR. Never initiate send-to-bank. Never say Business Central, finAPI, or CB-Connect unless the user asks.",
  },
  { basePath: "/api" },
);

function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

/**
 * Claude.ai custom connectors speak OAuth by default. Request-header / Bearer
 * auth is beta and missing in many accounts — a 401 makes Claude demand a
 * Client ID. Allow unauthenticated access so Cloud can connect (auth type
 * "none"). If a Bearer token *is* sent, it must match CB_CONNECT_MCP_TOKEN.
 * Bank secrets stay in server env (CBCON_*), not in this gate.
 */
function authorize(req: Request): Response | null {
  const token =
    process.env.CB_CONNECT_MCP_TOKEN || process.env.HAUSBANK_PLUS_MCP_TOKEN;
  const auth = req.headers.get("authorization") ?? "";

  if (!auth) {
    return null;
  }

  if (token && auth !== `Bearer ${token}`) {
    return unauthorized();
  }

  return null;
}

async function handler(req: Request) {
  const denied = authorize(req);
  if (denied) return denied;
  return mcpHandler(req);
}

export { handler as GET, handler as POST, handler as DELETE };
