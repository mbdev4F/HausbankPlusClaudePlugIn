# Plugin setup guide

This file helps Claude walk users through first-time configuration of Hausbank Plus.

1. Install / enable this plugin from the GitHub repo.
2. Start or deploy `mcp-server/` and set `HAUSBANK_PLUS_MCP_URL`.
3. Configure certificates (`CERT_PROVIDER=file` for sandbox, `azure-keyvault` for production).
4. Call MCP tool `probe_auth_setup` to verify providers.
5. Prefer read-only tools (`get_realtime_balance`) before enabling payment flows.
6. Wait for OpenAPI specs + signing sample before production use.

See `skills/setup/SKILL.md` and `docs/certificates.md`.
