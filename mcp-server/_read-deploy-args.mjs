import { readFileSync } from "node:fs";
const args = JSON.parse(
  readFileSync("C:/Users/marku/AppData/Local/Temp/mcp-deploy-args.json", "utf8"),
);
process.stdout.write(JSON.stringify(args));
