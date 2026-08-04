import { readFileSync } from "node:fs";
const args = JSON.parse(
  readFileSync(new URL("./_vercel-deploy-lean.json", import.meta.url), "utf8"),
);
if (args.files.length !== 54) process.exit(2);
if (!args.files.some((f) => f.file === "app/api/mcp/route.ts")) process.exit(3);
process.stdout.write(
  JSON.stringify({
    target: args.target,
    name: args.name,
    teamId: args.teamId,
    projectSettings: args.projectSettings,
    files: args.files,
  }),
);
