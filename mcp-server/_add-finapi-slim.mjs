import fs from "node:fs";
import path from "node:path";

const slim = "mcp-server/_slim-deploy";

function cpDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, e.name);
    const to = path.join(dest, e.name);
    if (e.isDirectory()) cpDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

cpDir("mcp-server/src/finapi", path.join(slim, "src/finapi"));
fs.copyFileSync(
  "mcp-server/src/operations-finapi.ts",
  path.join(slim, "src/operations-finapi.ts"),
);

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, a);
    else if (/\.(ts|tsx)$/.test(e.name)) a.push(p);
  }
  return a;
}

let changed = 0;
for (const file of walk(path.join(slim, "src"))) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(/(from\s+["'][^"']+)\.js(["'])/g, "$1$2");
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
  }
}
console.log(JSON.stringify({ finapiFiles: fs.readdirSync(path.join(slim, "src/finapi")).length, stripped: changed }));
