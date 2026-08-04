import { readFileSync } from "node:fs";

const args = JSON.parse(
  readFileSync("C:/Users/marku/AppData/Local/Temp/mcp-deploy-args.json", "utf8"),
);

if (args.files.length !== 78) {
  console.error("Expected 78 files, got", args.files.length);
  process.exit(2);
}

// Emit deploy arguments as single-line JSON on stdout for MCP bridge consumers.
process.stdout.write(
  JSON.stringify({
    target: args.target,
    name: args.name,
    teamId: args.teamId,
    projectSettings: args.projectSettings,
    files: args.files,
  }),
);
