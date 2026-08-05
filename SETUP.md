# Setup / Connector + Plugin

Public docs: https://hausbank-plus-mcp.vercel.app/docs  
Privacy: https://hausbank-plus-mcp.vercel.app/privacy  
MCP: https://hausbank-plus-mcp.vercel.app/api/mcp

## Claude Cloud Connector

1. Connect URL above (OAuth / Entra).
2. Enter Environment + optional Company GUID, then Microsoft login.

## Claude Plugin (Claude Code / Cowork)

Plugin root = this repo (skills, commands, `.mcp.json` → same MCP URL).

**Produkt:** HausbankAgent = Embedded Banking (Deutsche Bank + PSD2 ~9.200 EU-Banken). Das Plugin hilft Claude, diesen Konnektor bestmöglich zu nutzen.

### Local test

```bash
# from repo root
claude plugin validate
claude --plugin-dir .
```

Slash commands (namespaced): `/hausbank-agent:setup`, `:dashboard`, `:party`, `:pay-draft`, `:uetr`.

### Install from this repo (marketplace)

Marketplace- und Plugin-Name müssen **kebab-case** sein (`hausbank-agent`) — sonst schlägt Claude.ai Sync fehl.

```text
/plugin marketplace add mbdev4F/HausbankPlusClaudePlugIn
/plugin install hausbank-agent@hausbank-agent
```

Or install by path while developing: `claude --plugin-dir <path-to-this-repo>`.

### Scope

| Claude may | Claude must not |
| --- | --- |
| Setup, dashboard, vendors/customers | `send_payment_to_bank` |
| Payment drafts + approve | Starne payment links |
| SWIFT UETR / G4C lookup | Claim payment was sent to bank |

Bank initiation stays in the Hausbank product UI.

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
