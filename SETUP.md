# Setup / Connector docs

Public docs (live): https://hausbank-plus-mcp.vercel.app/docs  
Privacy: https://hausbank-plus-mcp.vercel.app/privacy  
MCP: https://hausbank-plus-mcp.vercel.app/api/mcp

## Claude Cloud Connector

1. Connect URL above (OAuth / Entra).
2. Enter Environment + optional Company GUID, then Microsoft login.

## Entra App Registration

1. **Umleitungs-URI (Web):**  
   `https://hausbank-plus-mcp.vercel.app/api/oauth/callback`
2. Kontotyp: **Mehrere Mandanten**
3. API-Berechtigung: Dynamics 365 Business Central → `user_impersonation`
4. Vercel: `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `OAUTH_SIGNING_SECRET`,  
   `HAUSBANK_AGENT_PUBLIC_ORIGIN=https://hausbank-plus-mcp.vercel.app`

## Directory submission notes

- Docs + Privacy URLs above
- Every tool has `title` + `readOnlyHint` / `destructiveHint`
- Catch-all request split into `hausbank_agent_read_request` / `hausbank_agent_write_request`
- Anthropic policy may reject connectors that **transfer money** — payment send / Starne Payment Link may need review discussion
