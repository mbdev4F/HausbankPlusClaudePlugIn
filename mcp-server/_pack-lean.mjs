import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = "mcp-server";
const git = fs.existsSync("C:/Program Files/Git/mingw64/bin/git.exe")
  ? "C:/Program Files/Git/mingw64/bin/git.exe"
  : "C:/Program Files/Git/bin/git.exe";

function gitShow(repoPath) {
  return execFileSync(git, ["show", `HEAD:${repoPath}`], { encoding: "utf8" });
}

const tracked = execFileSync(git, ["ls-files", "mcp-server"], { encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((f) => /\.(ts|tsx|json)$/i.test(f) && !f.endsWith("package-lock.json"));

// Prefer HEAD content for WIP-touched sources so deploy stays buildable.
const forceHead = new Set([
  "mcp-server/src/tools/index.ts",
  "mcp-server/package.json",
]);

const files = [];
for (const abs of tracked) {
  const rel = path.relative(root, abs).split(path.sep).join("/");
  let data;
  if (forceHead.has(abs.replace(/\\/g, "/")) || forceHead.has(abs)) {
    try {
      data = gitShow(abs.replace(/\\/g, "/"));
    } catch {
      data = fs.readFileSync(abs, "utf8");
    }
  } else if (abs.replace(/\\/g, "/") === "mcp-server/app/api/mcp/route.ts") {
    data = fs.readFileSync(abs, "utf8"); // authless fix from working tree
  } else {
    // For other modified files, use HEAD to avoid WIP breakage
    try {
      data = gitShow(abs.replace(/\\/g, "/"));
    } catch {
      data = fs.readFileSync(abs, "utf8");
    }
  }
  files.push({ file: rel, data });
}

// Ensure Next.js surface exists (may already be tracked)
const ensure = [
  "app/api/mcp/route.ts",
  "app/api/healthz/route.ts",
  "app/layout.tsx",
  "app/page.tsx",
  "next.config.ts",
  "next-env.d.ts",
  "vercel.json",
  "tsconfig.json",
  "package.json",
];
const have = new Set(files.map((f) => f.file));
for (const rel of ensure) {
  if (have.has(rel)) continue;
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  files.push({
    file: rel,
    data:
      rel === "app/api/mcp/route.ts"
        ? fs.readFileSync(abs, "utf8")
        : fs.existsSync(abs)
          ? fs.readFileSync(abs, "utf8")
          : "",
  });
}

// Always overwrite mcp route with working-tree authless version
const routeIdx = files.findIndex((f) => f.file === "app/api/mcp/route.ts");
const routeData = fs.readFileSync(path.join(root, "app/api/mcp/route.ts"), "utf8");
if (routeIdx >= 0) files[routeIdx].data = routeData;
else files.push({ file: "app/api/mcp/route.ts", data: routeData });

const payload = {
  target: "production",
  name: "hausbank-plus-mcp",
  teamId: "team_3VFzx5mOyURjd4H3vwrLslA6",
  projectSettings: { framework: "nextjs" },
  files,
};

fs.writeFileSync("mcp-server/_vercel-deploy-lean.json", JSON.stringify(payload));
console.log(
  JSON.stringify({
    files: files.length,
    bytes: Buffer.byteLength(JSON.stringify(payload)),
    authless: routeData.includes("Allow unauthenticated"),
    hasFinapiImport: files.some(
      (f) => f.file === "src/tools/index.ts" && f.data.includes("operations-finapi"),
    ),
  }),
);
