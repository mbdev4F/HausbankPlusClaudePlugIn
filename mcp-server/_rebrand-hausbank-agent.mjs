import fs from "node:fs";

const path = "mcp-server/src/mcp-tools-banqr.ts";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
  /^\/\*\*[\s\S]*?\*\//,
  `/**
 * Hausbank-Agent MCP tools (CloudConnector APIs).
 * User-facing name: always "Hausbank-Agent".
 * Tool names: hausbank_agent_* (e.g. hausbank_agent_list_payments).
 */`,
);

// Rename tool prefixes
s = s.replace(/name: "hb365_/g, 'name: "hausbank_agent_');
s = s.replace(/case "hb365_/g, 'case "hausbank_agent_');
s = s.replace(/Prefer named hb365_\*/g, "Prefer named hausbank_agent_*");
s = s.replace(/hb365_list_companies/g, "hausbank_agent_list_companies");
s = s.replace(/HB365_COMPANY_ID/g, "HAUSBANK_AGENT_COMPANY_ID");

// User-facing brand in descriptions
s = s.split("Hausbank365").join("Hausbank-Agent");
s = s.split("HB365").join("Hausbank-Agent");

// Legacy aliases: bc_* and hb365_* → hausbank_agent_*
s = s.replace(
  /const tool = name\.startsWith\("bc_"\) \? `hb365_\$\{name\.slice\(3\)\}` : name;/,
  `let tool = name;
  if (name.startsWith("hausbank_agent_")) tool = name;
  else if (name.startsWith("hb365_")) tool = "hausbank_agent_" + name.slice(6);
  else if (name.startsWith("bc_")) tool = "hausbank_agent_" + name.slice(3);`,
);

s = s.replace(
  /return name\.startsWith\("hb365_"\) \|\| name\.startsWith\("bc_"\);/,
  'return name.startsWith("hausbank_agent_") || name.startsWith("hb365_") || name.startsWith("bc_");',
);

fs.writeFileSync(path, s);
console.log({
  tools: (s.match(/name: "hausbank_agent_/g) || []).length,
  hb365Left: (s.match(/name: "hb365_/g) || []).length,
  hausbank365Left: (s.match(/Hausbank365/g) || []).length,
});
