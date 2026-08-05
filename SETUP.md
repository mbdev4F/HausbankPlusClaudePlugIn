# Setup

## Claude Cloud Connector

1. URL: `https://hausbank-plus-mcp.vercel.app/api/mcp`
2. Auth: OAuth (Entra) — after `ENTRA_*` is configured on Vercel

## Entra App Registration

1. **Umleitungs-URI (Web):**  
   `https://hausbank-plus-mcp.vercel.app/api/oauth/callback`
2. Kontotyp: **Mehrere Mandanten** (beliebiges Organisationsverzeichnis)
3. API-Berechtigung: Dynamics 365 Business Central → `user_impersonation` (delegiert)
4. Clientgeheimnis erzeugen → in Vercel als `ENTRA_CLIENT_SECRET`
5. Vercel-Env: `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `OAUTH_SIGNING_SECRET`,  
   `HAUSBANK_AGENT_PUBLIC_ORIGIN=https://hausbank-plus-mcp.vercel.app`

Beim Connect fragt HausbankAgent nach **Environment** + optional **Company-ID**, dann Microsoft-Login. Tenant kommt aus dem Token.
