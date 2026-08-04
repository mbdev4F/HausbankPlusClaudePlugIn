import { readFileSync } from "node:fs";

const path =
  process.env.MCP_DEPLOY_ARGS ??
  "C:/Users/marku/AppData/Local/Temp/mcp-deploy-args.json";

const args = JSON.parse(readFileSync(path, "utf8"));

if (!Array.isArray(args.files) || args.files.length !== 78) {
  console.error(
    JSON.stringify({
      ok: false,
      error: `expected 78 files, got ${args.files?.length ?? 0}`,
    }),
  );
  process.exit(2);
}

// Emit compact summary for logs; full args stay in memory for MCP bridge consumers.
console.log(
  JSON.stringify({
    ok: true,
    target: args.target,
    name: args.name,
    teamId: args.teamId,
    projectSettings: args.projectSettings,
    filesCount: args.files.length,
    bytes: Buffer.byteLength(JSON.stringify(args)),
    hasMcpRoute: args.files.some((f) => f.file === "app/api/mcp/route.ts"),
    hasToolsIndex: args.files.some((f) => f.file === "src/tools/index.ts"),
  }),
);

export default args;
