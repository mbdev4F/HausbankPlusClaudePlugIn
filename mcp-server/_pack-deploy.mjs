import fs from "node:fs";
import path from "node:path";

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ["node_modules", ".next", ".vercel"].includes(ent.name) ||
      ent.name.startsWith("_")
    ) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|json)$/i.test(ent.name) && ent.name !== "package-lock.json") {
      acc.push(p);
    }
  }
  return acc;
}

const root = path.join("mcp-server");
const files = walk(root).map((f) => ({
  file: path.relative(root, f).split(path.sep).join("/"),
  data: fs.readFileSync(f, "utf8"),
}));

const payload = {
  target: "production",
  name: "hausbank-plus-mcp",
  teamId: "team_3VFzx5mOyURjd4H3vwrLslA6",
  projectSettings: { framework: "nextjs" },
  files,
};

fs.writeFileSync(path.join("mcp-server", "_vercel-deploy.json"), JSON.stringify(payload));
console.log("files", files.length, "bytes", Buffer.byteLength(JSON.stringify(payload)));
