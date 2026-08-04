import fs from "node:fs";
import path from "node:path";

const files = [
  "env-config.ts",
  "resolved-credentials.ts",
  "endpoints-store.ts",
  "endpoints-shared.ts",
  "cb-connect-sandbox-defaults.ts",
  "cb-connect-http.ts",
  "cb-connect-signing-core.ts",
  "cb-connect-signature.ts",
  "cb-connect-client.ts",
  "cb-connect-balance-parse.ts",
  "p12-key.ts",
  "p12-tls.ts",
];

const dest = "mcp-server/_slim-deploy/src/cb-connect";
fs.mkdirSync(dest, { recursive: true });
for (const f of files) {
  fs.copyFileSync(path.join("mcp-server/src/cb-connect", f), path.join(dest, f));
}
fs.copyFileSync(
  "mcp-server/_slim-deploy/balance-entry.ts",
  "mcp-server/_slim-deploy/lib/balance.ts",
);

console.log(fs.readdirSync(dest).join(","));
console.log("balance", fs.statSync("mcp-server/_slim-deploy/lib/balance.ts").size);

const bad = [];
for (const f of fs.readdirSync(dest)) {
  const t = fs.readFileSync(path.join(dest, f), "utf8");
  for (const m of t.matchAll(/from ["']([^"']+)["']/g)) {
    const im = m[1];
    if (im.startsWith("../") && !im.includes("cb-connect")) {
      bad.push(`${f}:${im}`);
    }
  }
}
console.log("external-imports", bad);
