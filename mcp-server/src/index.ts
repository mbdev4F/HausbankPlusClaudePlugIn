import { config } from "dotenv";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./tools/index.js";
import { loadConfig } from "./config.js";
import { createCertificateProvider } from "./auth/certificate.js";
import { createSigningProvider } from "./auth/signing.js";
import { HausbankApiClient } from "./clients/hausbank.js";

config();

const appConfig = loadConfig();
const certProvider = createCertificateProvider(appConfig);
const signingProvider = createSigningProvider(appConfig);
const api = new HausbankApiClient(appConfig, certProvider, signingProvider);

const mcp = new McpServer({
  name: "hausbank-plus",
  version: "0.1.0",
});

registerTools(mcp, api);

const port = appConfig.port;

const httpServer = createServer(async (req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "hausbank-plus-mcp" }));
    return;
  }

  if (req.url?.startsWith("/mcp")) {
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
  console.log(`[hausbank-plus-mcp] listening on :${port} (cert=${appConfig.certProvider}, signing=${appConfig.signingMode})`);
});
