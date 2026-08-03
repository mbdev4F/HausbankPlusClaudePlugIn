# Deutsche Bank CB-Connect — Claude Plugin

Claude-Plugin + MCP-Server für **Deutsche Bank CB-Connect (BaaS)**.

Konnektoren (HTTP, mTLS, HTTP-Signatur, Parser, Builder) stammen aus dem produktiven TypeScript-Code von **db** (`lib/native-bank-connectivity`), entkoppelt vom Next.js-Team-Store.

## Architektur

| Schicht | Rolle |
| --- | --- |
| **MCP-Server** (`mcp-server/`) | Tools für Saldo, Statements, VoP, SEPA Instant, SWIFT GPI, FX4Cash |
| **Plugin Skills** | Workflows (VoP vor Versand, Freigabe-Reihenfolge) |
| **CB-Connect Lib** (`mcp-server/src/cb-connect/`) | Portierte HealthFlow-Konnektoren |

```
Claude ──Skills──► Plugin ──HTTP MCP──► mcp-server ──mTLS+Sign──► api.sbx.baas.db.com / Prod
```

## Tools

| Tool | Domäne |
| --- | --- |
| `probe_auth_setup` / `probe_token_and_health` | Diagnose |
| `get_realtime_balance` | Saldo |
| `request_account_statement` / `load_account_statement` | CAMT Statements |
| `verify_payee` | Verification of Pay |
| `initiate_instant_payment` / `get_instant_payment_status` | SEPA Instant  |
| `get_swift_payment_status` | SWIFT GPI for Corporates |
| `initiate_fx4cash` / `get_fx4cash_status` / `evaluate_fx4cash_value_date` | FX4Cash |

Mehrstufige Freigabe bleibt Skill-/Prozess-Ebene (wie in Bank ABAC); die Bank-APIs sind Instant + VoP + Status.

## Schnellstart

```bash
cd mcp-server
cp ../.env.example .env
# CBCON_* Credentials + PKCS#12 Base64 eintragen
npm install
npm run dev
```

Plugin: `claude --plugin-dir .` im Repo-Root. Env: `CB_CONNECT_MCP_URL`, `CB_CONNECT_MCP_TOKEN`.

## Zertifikate

| Phase | Empfehlung |
| --- | --- |
| Sandbox | `CBCON_CERTIFICATEBASE64` + Passwort, ggf. `CBCON_TLS_INSECURE=true` |
| Produktion | Azure Key Vault Signing (`AZURE_KEY_VAULT_*`) — Code unter `src/azure-key-vault/` + `cb-connect-keyvault-signer.ts` |

## Herkunft

Portiert aus `C:\banqr_dev\dbHealthflow\lib\native-bank-connectivity` (ohne Team-Store, UI, ABAC).

## Lizenz

MIT — siehe [LICENSE](LICENSE).
