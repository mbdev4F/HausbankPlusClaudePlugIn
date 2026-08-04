# Plugin setup

1. Start `mcp-server` with the relevant connector credentials.
2. Set `CB_CONNECT_MCP_URL` and `CB_CONNECT_MCP_TOKEN`.
3. **CB-Connect:** `probe_auth_setup` → `probe_token_and_health`.
4. **SME Deutsche Bank Connector:** set `SME_DB_*`, call `sme_db_oauth_start`, complete browser OAuth, store `SME_DB_REFRESH_TOKEN`, then `sme_db_probe_auth`.
5. **finAPI:** `finapi_probe_auth` (+ optional `finapi_provision_user`).
6. **Better Payment:** `better_payment_probe_auth`, then `create_payment_link` (`wero` / `pay_by_bank`).
7. Prefer read-only tools before payment tools.

See `skills/setup/SKILL.md` and `docs/certificates.md`.
