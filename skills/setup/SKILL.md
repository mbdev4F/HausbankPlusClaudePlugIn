---
name: setup
description: This skill should be used when the user installs or configures the Hausbank Plus Claude plugin, connects the MCP server, sets certificate providers, or asks how to get started with Deutsche Bank / Postbank First connectivity.
---

# Hausbank Plus — Setup

Guide the user through configuring the Hausbank Plus connector. Do not invent API endpoints; the MCP server is stubbed until OpenAPI specs arrive.

## Steps

1. Confirm the plugin is loaded (Claude Code: `--plugin-dir` or marketplace install).
2. Ensure the MCP server is reachable:
   - Local: `cd mcp-server && npm install && npm run dev`
   - Remote: set `HAUSBANK_PLUS_MCP_URL` and `HAUSBANK_PLUS_MCP_TOKEN`
3. Certificate setup:
   - Dev: `CERT_PROVIDER=file` + paths in `.env` (see repo `.env.example`)
   - Prod: `CERT_PROVIDER=azure-keyvault` + Managed Identity (see `docs/certificates.md`)
4. Verify read-only connectivity first (`get_realtime_balance` / `list_global_accounts`) before enabling payment tools.
5. Remind the user that signing is still a stub until they provide the signing framework code.

## References

- `docs/architecture.md`
- `docs/certificates.md`
- `docs/api-specs/README.md`
