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
      name: "db-cb-connect",
      version: "0.2.0",
    },
  },
  { basePath: "/api" },
);

function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

function authorize(req: Request): Response | null {
  const token =
    process.env.CB_CONNECT_MCP_TOKEN || process.env.HAUSBANK_PLUS_MCP_TOKEN;
  if (!token) {
    if (process.env.VERCEL_ENV === "production") {
      return unauthorized();
    }
    return null;
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${token}`) {
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
