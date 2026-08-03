# Hausbank Plus MCP Server

TypeScript MCP server (Streamable HTTP) that will call Deutsche Bank / Hausbank Plus APIs with **mTLS** and **request signing**.

## Status

Scaffold: tools return structured `not_implemented` until OpenAPI specs and the signing framework arrive.

## Run locally

```bash
cp ../.env.example .env
npm install
npm run dev
# → http://localhost:8787/mcp
```

## Certificate providers

Set `CERT_PROVIDER=file` or `azure-keyvault`. See `../docs/certificates.md`.

## Tool surface

See `src/tools/index.ts`. Domains: balances, statements, zipa, vop, approvals, swift, fx.
