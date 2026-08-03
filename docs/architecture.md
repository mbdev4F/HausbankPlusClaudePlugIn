# Architektur — Hausbank Plus Claude Connector

## Zielbild

Ein Claude-Plugin, das Bankfachlichkeit (Skills) mit einem Remote-MCP-Server kombiniert, der die Deutsche-Bank-/Hausbank-Plus-APIs mit Client-Zertifikat und Request-Signing aufruft. Abgedeckt sind u. a. Postbank First und das globale DB-Setup.

## Schichten

1. **Plugin-Schicht** — Skills, Commands, Agenten. Keine Secrets, keine Raw-HTTP-Calls zur Bank.
2. **MCP-Schicht** — Tools mit klaren Inputs/Outputs, Annotations (`readOnlyHint` / `destructiveHint`).
3. **Auth-Schicht** — Certificate Provider (File | Azure Key Vault) + Signing Provider (Stub → euer Framework).
4. **API-Client** — Pro Domäne (Balances, Statements, Payments/ZIPA, VoP, Approvals, SWIFT, FX). Specs kommen per Swagger.

## Tool-Gruppen (MCP)

| Tool | Hint | Domäne |
| --- | --- | --- |
| `get_realtime_balance` | read-only | Cash |
| `list_global_accounts` | read-only | Cash |
| `get_account_statement` | read-only | Reporting |
| `create_zipa_payment` | destructive | Payments |
| `verify_payee` (VoP) | read-only / confirm | Compliance |
| `submit_for_approval` | destructive | Workflow |
| `approve_payment` | destructive | Workflow |
| `reject_payment` | destructive | Workflow |
| `send_payment_to_bank` | destructive | Payments |
| `get_swift_payment_status` | read-only | Tracking |
| `initiate_fx_forward` | destructive | FX |
| `get_fx_forward_status` | read-only | FX |

Tool-Namen und Schemas werden angepasst, sobald die echten OpenAPI-Operationen vorliegen.

## Warum Remote MCP (nicht nur stdio)?

- Cloud-/Cowork-/claude.ai-Nutzung braucht HTTP-Transport
- Zertifikat und Signing laufen serverseitig unter eurer Kontrolle
- Mehrere Nutzer / Rollen möglich (später OAuth / Enterprise Managed Auth)

Für lokale Dev-Sessions kann derselbe Server per `npm run dev` auf localhost laufen; `.mcp.json` zeigt per Env auf die URL.

## Mehrstufige Freigabe (fachliches Modell)

```
draft → vop_pending → vop_ok → approval_L1 → approval_L2(+…) → ready_to_send → sent → swift_tracked
                 ↘ vop_mismatch (Abbruch oder Korrektur)
                          ↘ rejected
```

Skills erzwingen diese Reihenfolge; MCP-Tools spiegeln Zustandsübergänge und lehnen ungültige Sprünge ab (sobald Backend-Semantik bekannt ist).

## API-Onboarding-Prozess

1. Spec (Postman Collection / OpenAPI) nach `docs/api-specs/<domain>.yaml` legen
2. Client-Methode in `mcp-server/src/clients/` ergänzen
3. Tool in `mcp-server/src/tools/` verdrahten
4. Skill-Referenzen aktualisieren (`skills/*/references/`)
5. Smoke-Test gegen Sandbox
