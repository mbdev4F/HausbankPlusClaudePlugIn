import fs from "node:fs";
import path from "node:path";

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("VERCEL_TOKEN missing");
  process.exit(1);
}

const teamId = "team_3VFzx5mOyURjd4H3vwrLslA6";
const root = "mcp-server/_slim-deploy";
const skipDirs = new Set(["node_modules", ".next", ".vercel", ".git"]);

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (skipDirs.has(e.name)) continue;
      walk(p, a);
    } else {
      a.push(p);
    }
  }
  return a;
}

const files = walk(root).map((abs) => {
  const rel = path.relative(root, abs).split(path.sep).join("/");
  const buf = fs.readFileSync(abs);
  return {
    file: rel,
    data: buf.toString("base64"),
    encoding: "base64",
  };
});

console.log("uploading", files.length, "files");

const res = await fetch(
  `https://api.vercel.com/v13/deployments?teamId=${teamId}&skipAutoDetectionConfirmation=1`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "hausbank-plus-mcp",
      project: "hausbank-plus-mcp",
      target: "production",
      projectSettings: { framework: "nextjs" },
      files,
    }),
  },
);

const text = await res.text();
console.log("status", res.status);
console.log(text.slice(0, 3000));
if (!res.ok) process.exit(1);

const json = JSON.parse(text);
console.log("url", json.url);
console.log("id", json.id);
