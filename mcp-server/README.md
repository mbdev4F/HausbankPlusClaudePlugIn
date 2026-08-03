# Deutsche Bank CB-Connect MCP Server

TypeScript MCP server (Streamable HTTP) calling Deutsche Bank CB-Connect with **mTLS** and **HTTP signatures**.

## Run locally (Next.js — same surface as Vercel)

```bash
cp ../.env.example .env
npm install
npm run dev
# → http://localhost:8787/api/mcp
# → http://localhost:8787/api/healthz
```

Optional standalone Node HTTP: `npm run dev:standalone`.

## Deploy to Vercel

Project: [hausbank-plus-mcp](https://vercel.com/mb4-projects/hausbank-plus-mcp)  
Public MCP: `https://hausbank-plus-mcp.vercel.app/api/mcp`

Set at least `CB_CONNECT_MCP_TOKEN` (and later `CBCON_*` bank credentials) in Vercel Environment Variables.

## Tools

See `src/tools/index.ts` and `src/operations.ts`.
