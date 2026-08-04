import fs from "node:fs";
import path from "node:path";

const root = "mcp-server/_slim-deploy";
const skip = new Set(["balance-entry.ts", "balance.cjs"]);

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "lib" && false) walk(p, a);
      else if (e.name === "node_modules") continue;
      else walk(p, a);
    } else if (!skip.has(e.name)) a.push(p);
  }
  return a;
}

const files = walk(root).map((f) => ({
  file: path.relative(root, f).split(path.sep).join("/"),
  data: fs.readFileSync(f, "utf8"),
}));

// drop leftover bundled cjs if present under lib/
const filtered = files.filter((f) => f.file !== "lib/balance.cjs");

const payload = {
  target: "production",
  name: "hausbank-plus-mcp",
  teamId: "team_3VFzx5mOyURjd4H3vwrLslA6",
  projectSettings: { framework: "nextjs" },
  files: filtered,
};

fs.writeFileSync("mcp-server/_deploy-args.json", JSON.stringify(payload));
console.log(
  JSON.stringify({
    count: filtered.length,
    bytes: Buffer.byteLength(JSON.stringify(payload)),
    names: filtered.map((f) => f.file),
  }),
);
