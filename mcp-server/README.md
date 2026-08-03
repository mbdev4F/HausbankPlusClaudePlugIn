# CB-Connect MCP Server

Port of Deutsche Bank CB-Connect connectors from dbHealthflow.

## Run

```bash
cp ../.env.example .env
npm install
npm run dev
```

## Layout

- `src/cb-connect/` — ported HealthFlow API layer (mTLS, signing, parsers, builders)
- `src/azure-key-vault/` — optional Key Vault RSA signing
- `src/operations.ts` — MCP-facing façade
- `src/tools/` — MCP tool registration

Credentials: `CBCON_*` env vars (same names as HealthFlow).
