import { config } from "dotenv";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./tools/index.js";
import { loadConfig } from "./config.js";

config();

const appConfig = loadConfig();

const mcp = new McpServer({
  name: "db-cb-connect",
  version: "0.2.0",
});

registerTools(mcp);

const port = appConfig.port;

const httpServer = createServer(async (req, res) => {
  if (req.url === "/healthz" || req.url === "/api/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "db-cb-connect-mcp" }));
    return;
  }

  if (req.url?.startsWith("/mcp") || req.url?.startsWith("/api/mcp")) {
    if (appConfig.mcpToken) {
      const auth = req.headers.authorization ?? "";
      const expected = `Bearer ${appConfig.mcpToken}`;
      if (auth !== expected) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "unauthorized" }));
        return;
      }
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    await mcp.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

httpServer.listen(port, () => {
  console.log(
    `[db-cb-connect-mcp] listening on :${port} (certProvider=${appConfig.certProvider})`
  );
});
