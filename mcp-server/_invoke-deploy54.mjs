import { readFileSync, writeFileSync } from "node:fs";

const args = JSON.parse(
  readFileSync(new URL("./_vercel-deploy-lean.json", import.meta.url), "utf8"),
);

if (args.files.length !== 54) {
  console.error("files.length", args.files.length);
  process.exit(2);
}
if (!args.files.some((f) => f.file === "app/api/mcp/route.ts")) {
  process.exit(3);
}

// Emit compact single-line JSON for MCP bridge consumers.
writeFileSync(
  new URL("./_deploy-mcp-oneline.json", import.meta.url),
  JSON.stringify(args),
);
console.log(
  JSON.stringify({
    ok: true,
    files: args.files.length,
    bytes: Buffer.byteLength(JSON.stringify(args)),
  }),
);
