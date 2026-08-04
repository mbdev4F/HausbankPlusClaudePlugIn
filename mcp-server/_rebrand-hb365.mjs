import fs from "node:fs";

const path = "mcp-server/src/mcp-tools-banqr.ts";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
  /^\/\*\*[\s\S]*?\*\//,
  `/**
 * Hausbank365 (HB365) MCP tools — CloudConnector APIs.
 * User-facing product name is always Hausbank365 / HB365.
 * Do not mention the underlying ERP platform name in tool descriptions.
 */`,
);

s = s.replace(/name: "bc_/g, 'name: "hb365_');
s = s.replace(/case "bc_/g, 'case "hb365_');
s = s.replace(/Prefer named bc_\*/g, "Prefer named hb365_*");
s = s.replace(
  /return name === "bc_request" \|\| name\.startsWith\("bc_"\);/,
  'return name.startsWith("hb365_") || name.startsWith("bc_");',
);

const repls = [
  [
    "Optional BC company GUID (defaults to BC_COMPANY_ID)",
    "Optional Hausbank365 company GUID (defaults to HB365_COMPANY_ID)",
  ],
  [
    "Diagnostics: Business Central Banqr env + client_credentials token (no secrets).",
    "Diagnostics: Hausbank365 env + client_credentials token (no secrets).",
  ],
  [
    "List BC companies via Banqr bankaccounts API. Use id as companyId.",
    "List Hausbank365 companies. Use returned id as companyId.",
  ],
  [
    "Low-level Banqr/BC OData call. Path may include {companyId}. Prefer named hb365_* tools when possible.",
    "Low-level Hausbank365 API call. Path may include {companyId}. Prefer named hb365_* tools when possible.",
  ],
  [
    "Get Cash365/Hausbank Banqr setup records.",
    "Get Hausbank365 setup records.",
  ],
  ["PATCH Banqr setup by setupId", "PATCH Hausbank365 setup by setupId"],
  [
    "Create openBankingConnectors (finAPI) setup row in BC.",
    "Create openBankingConnectors (finAPI) setup row in Hausbank365.",
  ],
  [
    "List Banqr bank accounts (balances etc. in BC).",
    "List Hausbank365 bank accounts (incl. balances).",
  ],
  ["Create bank account in BC.", "Create bank account in Hausbank365."],
  [
    "refresh balance/transactions from bank into BC.",
    "refresh balance/transactions from bank into Hausbank365.",
  ],
  [
    "List Banqr transactions in BC.",
    "List Hausbank365 transactions.",
  ],
  ["List Banqr payments in BC.", "List Hausbank365 payments."],
  ["List Banqr API call log.", "List Hausbank365 API call log."],
  ["Banqr BC MCP tool definitions", "Hausbank365 MCP tool definitions"],
];

for (const [a, b] of repls) s = s.split(a).join(b);
s = s.split("Business Central").join("Hausbank365");
s = s.split("Banqr/BC").join("Hausbank365");

// Map legacy bc_* calls to hb365_* handlers
s = s.replace(
  "export async function callBanqrBcTool(\n  name: string,\n  args: Record<string, unknown>,\n): Promise<unknown> {\n  switch (name) {",
  `export async function callBanqrBcTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const tool = name.startsWith("bc_")
    ? "hb365_" + name.slice(3)
    : name;
  switch (tool) {`,
);

fs.writeFileSync(path, s);
console.log({
  hb365: (s.match(/name: "hb365_/g) || []).length,
  bcNames: (s.match(/name: "bc_/g) || []).length,
  bizCentral: (s.match(/Business Central/gi) || []).length,
  hasLegacyMap: s.includes('name.startsWith("bc_")'),
});
