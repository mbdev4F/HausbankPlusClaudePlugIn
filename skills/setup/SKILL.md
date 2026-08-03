---
name: setup
description: This skill should be used when the user installs or configures the Deutsche Bank CB-Connect Claude plugin, connects the MCP server, sets CBCON credentials, or asks how to get started.
---

# CB-Connect — Setup

1. Ensure MCP server is running (`mcp-server`: `npm run dev`).
2. Set `CB_CONNECT_MCP_URL` + `CB_CONNECT_MCP_TOKEN`.
3. Configure `CBCON_*` credentials and PKCS#12 (`CBCON_CERTIFICATEBASE64`).
4. Call `probe_auth_setup`, then `probe_token_and_health`.
5. Prefer read-only tools (`get_realtime_balance`) before payment tools.

Sandbox TLS tip: `CBCON_TLS_INSECURE=true` if Node does not trust `api.sbx.baas.db.com`.
