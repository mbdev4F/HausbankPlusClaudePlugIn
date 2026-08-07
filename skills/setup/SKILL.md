---
name: setup
description: One-time Hausbank-Agent MCP setup — Entra/BC auth, company, roles/rights, and connector health. Use when the user installs the plugin, connects for the first time, or asks to configure banking access.
---

# Setup (once)

Guide the user through Hausbank-Agent connectivity (Entra → Business Central). Do this once unless they ask to reconfigure.

For **Deutsche Bank BizBank** with Claude OAuth (tokens only in Claude), point them to the separate **BizBankingConnect** project — not this connector.

## Steps

1. Confirm the **HausbankAgent** MCP connector is available (OAuth / Entra). If missing, point them to Connect URL `https://hausbank-plus-mcp.vercel.app/api/mcp` or install plugin `hausbank-agent@hausbank-agent`.
2. Call `hausbank_agent_probe_auth` — report env/token health without secrets.
3. Call `hausbank_agent_list_companies` — help pick the company GUID if more than one.
4. Call `hausbank_agent_get_setup` — summarize setup state (certificates, secrets present/missing; never print secret values).
5. If setup is incomplete, walk through only what is missing:
   - `hausbank_agent_update_setup`
   - `hausbank_agent_set_client_secret` / `set_certificate` / `set_certificate_password` as needed
6. Optional PSD2 Multi-Banking: `hausbank_agent_finapi_create_connector` → auth page URL → `finapi_load_accounts` after the user completes bank login in the browser (~9,200 EU banks via PSD2).
7. Finish with a short checklist: auth OK, company selected, accounts visible via `hausbank_agent_list_accounts`.

## Rules

- Never invent credentials or company IDs.
- After a successful first setup, do not re-run the full flow unless the user asks.
