import { createMcpHandler } from "mcp-handler";
import { registerTools } from "@/src/tools";
import {
  oauthEnabled,
  parseBearerSession,
  unauthorizedMcpResponse,
} from "@/src/oauth/adapter";
import { runWithHausbankSession } from "@/src/oauth/session";

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
      "HausbankAgent is the user's Embedded Banking brain: primarily Deutsche Bank capabilities, plus PSD2 access to ~9,200 European banks. Prefer named hausbank_agent_* tools for companies, accounts, vendors, customers, payment drafts/approval, send-to-bank, statements, and G4C/UETR. Require explicit user confirmation before send_payment_to_bank. Never say Business Central, finAPI, or CB-Connect unless the user asks. For direct BizBank/SME API OAuth use the separate BizBankingConnect connector.",
  },
  { basePath: "/api" },
);

/**
 * When Entra OAuth is configured: require Claude Bearer session (BC).
 * Otherwise optional static MCP token (legacy).
 * BizBank Claude OAuth lives in the separate BizBankingConnect project.
 */
async function handler(req: Request) {
  if (oauthEnabled()) {
    const session = parseBearerSession(req);
    if (!session) {
      return unauthorizedMcpResponse();
    }
    return runWithHausbankSession(session, () => mcpHandler(req));
  }

  const token =
    process.env.CB_CONNECT_MCP_TOKEN || process.env.HAUSBANK_PLUS_MCP_TOKEN;
  const auth = req.headers.get("authorization") ?? "";
  if (auth && token && auth !== `Bearer ${token}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  return mcpHandler(req);
}

export { handler as GET, handler as POST, handler as DELETE };
