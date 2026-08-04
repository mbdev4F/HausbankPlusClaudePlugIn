import fs from "node:fs";
import path from "node:path";

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, a);
    else if (/\.(ts|tsx)$/.test(e.name)) a.push(p);
  }
  return a;
}

const roots = [
  "mcp-server/_slim-deploy/lib",
  "mcp-server/_slim-deploy/src",
  "mcp-server/_slim-deploy/app",
];

let changed = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const before = fs.readFileSync(file, "utf8");
    const after = before.replace(
      /(from\s+["'][^"']+)\.js(["'])/g,
      "$1$2",
    );
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed++;
      console.log("fixed", file);
    }
  }
}
console.log("files-changed", changed);
