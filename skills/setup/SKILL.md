---
name: setup
description: This skill should be used when the user installs or configures CB-Connect, SME Deutsche Bank Connector, finAPI, or Better Payment for the Claude plugin.
---

# Setup — alle Konnektoren

1. MCP-Server starten (`mcp-server`: `npm run dev`).
2. `CB_CONNECT_MCP_URL` + `CB_CONNECT_MCP_TOKEN` setzen.
3. **CB-Connect (Enterprise):** `CBCON_*` + Zertifikat → `probe_auth_setup` / `probe_token_and_health`.
4. **SME Deutsche Bank Connector** (Biz-Banking / Business Connector):
   - `SME_DB_CLIENT_ID` / `SME_DB_CLIENT_SECRET` / `SME_DB_PUBLIC_ORIGIN`
   - `sme_db_oauth_start` → Browser → Callback speichert Hinweis für `SME_DB_REFRESH_TOKEN`
   - `sme_db_probe_auth` → `sme_db_list_accounts`
5. **finAPI:** Client-Credentials + User → `finapi_probe_auth`.
6. **Better Payment:** API keys + HTTPS origin → `create_payment_link` mit `wero` oder `pay_by_bank`.

Hinweis: SME Deutsche Bank (`api.db.com`) ist **nicht** CB-Connect (`baas.db.com`).
