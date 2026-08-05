# Setup / Connector docs

Public docs: https://hausbank-plus-mcp.vercel.app/docs  
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

## Directory notes

- Docs + Privacy URLs above (bilingual examples on /docs)
- Tools have `title` + `readOnlyHint` / `destructiveHint`
- `send_payment_to_bank` and payment-link tools are **not** exposed (directory policy)
