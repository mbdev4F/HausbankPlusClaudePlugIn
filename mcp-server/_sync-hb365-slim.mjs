import fs from "node:fs";
import path from "node:path";

const toolsPath = "mcp-server/src/mcp-tools-banqr.ts";
let s = fs.readFileSync(toolsPath, "utf8");
s = s.split("Banqr recipient API").join("Hausbank365 recipient API");
s = s.split("List Banqr ").join("List Hausbank365 ");
fs.writeFileSync(toolsPath, s);

const slim = "mcp-server/_slim-deploy";
fs.mkdirSync(path.join(slim, "src/banqr-bc"), { recursive: true });
for (const n of fs.readdirSync("mcp-server/src/banqr-bc")) {
  fs.copyFileSync(
    path.join("mcp-server/src/banqr-bc", n),
    path.join(slim, "src/banqr-bc", n),
  );
}
fs.copyFileSync(
  "mcp-server/src/operations-banqr-bc.ts",
  path.join(slim, "src/operations-banqr-bc.ts"),
);
fs.copyFileSync(toolsPath, path.join(slim, "src/mcp-tools-banqr.ts"));
const synced = fs.readFileSync(path.join(slim, "src/mcp-tools-banqr.ts"), "utf8");
console.log({
  hb365: (synced.match(/name: "hb365_/g) || []).length,
  businessCentral: (synced.match(/Business Central/gi) || []).length,
});
