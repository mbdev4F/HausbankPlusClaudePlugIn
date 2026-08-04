# Deutsche Bank Connectors + finAPI + Better Payment — Claude Plugin

Claude-Plugin + MCP-Server für:

- **Deutsche Bank CB-Connect** (Enterprise / BaaS)
- **SME Deutsche Bank Connector** (Biz-Banking / ehem. Business Connector)
- **finAPI** (Open Banking / Multibank)
- **Better Payment** (Wero + Pay by Bank)

Konnektoren stammen aus **dbHealthflow** / Cash365, entkoppelt vom Next.js-Team-Store.

## Architektur

| Schicht | Rolle |
| --- | --- |
| **MCP-Server** (`mcp-server/`) | Tools für alle Konnektoren |
| **Plugin Skills** | Workflows (VoP vor Versand, Freigabe-Reihenfolge) |
| **CB-Connect** (`mcp-server/src/cb-connect/`) | Enterprise BaaS |
| **SME Deutsche Bank** (`mcp-server/src/sme-deutsche-bank/`) | Biz-Banking auf api.db.com |
| **finAPI** (`mcp-server/src/finapi/`) | Access + Web Form 2.0 |
| **Better Payment** (`mcp-server/src/better-payment/`) | Wero + Pay by Bank Links |
| **finAPI** (`mcp-server/src/finapi/`) | Access + Web Form 2.0 |
| **Hausbank-Agent** (`mcp-server/src/banqr-bc/`) | CloudConnector tools (`hausbank_agent_*`) |

Live Claude Cloud connector currently exposes **finAPI + Hausbank-Agent** only.

```
Claude ──► MCP ──► sandbox.finapi.io
              └──► Hausbank-Agent CloudConnector APIs
```

## Tools

### CB-Connect (Enterprise)

| Tool | Domäne |
| --- | --- |
| `probe_auth_setup` / `probe_token_and_health` | Diagnose |
| `get_realtime_balance` | Saldo |
| `request_account_statement` / `load_account_statement` | CAMT Statements |
| `verify_payee` | Verification of Pay |
| `initiate_instant_payment` / `get_instant_payment_status` | SEPA Instant  |
| `get_swift_payment_status` | SWIFT GPI for Corporates |
| `initiate_fx4cash` / `get_fx4cash_status` / `evaluate_fx4cash_value_date` | FX4Cash |

### SME Deutsche Bank Connector

Umbenannt aus HealthFlow/Cash365 **Deutsche Bank Biz-Banking** / Business Connector. **Nicht** CB-Connect.

| Tool | Domäne |
| --- | --- |
| `sme_db_probe_auth` | Diagnose |
| `sme_db_oauth_start` / `sme_db_oauth_complete` | OAuth (Browser + Refresh-Token) |
| `sme_db_list_accounts` / `sme_db_list_transactions` | Konten + AIS-Umsätze |
| `sme_db_check_instant_reachability` | Instant-Erreichbarkeit |
| `sme_db_list_sca_methods` / `sme_db_start_sca_challenge` / `sme_db_complete_sca_challenge` | SCA (Photo/mTAN/Push) |
| `sme_db_initiate_instant_payment` / `sme_db_get_payment_status` | Instant SEPA |
| `sme_db_list_credit_cards` | Kreditkarten |

OAuth-Callback: `/api/sme-db-oauth/callback` — zeigt den Refresh-Token einmalig zum Speichern als `SME_DB_REFRESH_TOKEN`.

### finAPI (Open Banking)

| Tool | Domäne |
| --- | --- |
| `finapi_probe_auth` / `finapi_provision_user` | Diagnose / User anlegen |
| `finapi_list_accounts` / `finapi_list_bank_connections` | Konten + Salden |
| `finapi_list_transactions` | AIS-Umsätze (JSON) |
| `finapi_start_bank_connection` / `finapi_get_webform_status` | Bank anbinden (Web Form + SCA) |
| `finapi_initiate_sepa_payment` / `finapi_initiate_standalone_payment` | SEPA via Web Form |
| `finapi_get_payment_status` | Zahlungsstatus |

### Better Payment (Payment Links)

| Tool | Domäne |
| --- | --- |
| `better_payment_probe_auth` / `list_payment_methods` | Diagnose / Methoden |
| `create_payment_link` | Payment-Link mit **Wero** oder **Pay by Bank** |
| `get_payment_link_status` | Transaktionsstatus |

## Schnellstart

```bash
cd mcp-server
cp ../.env.example .env
# Credentials eintragen
npm install
npm run dev
# → http://localhost:8787/api/mcp  |  /api/healthz
```

Plugin: `claude --plugin-dir .` im Repo-Root. Env: `CB_CONNECT_MCP_URL`, `CB_CONNECT_MCP_TOKEN`.

### Vercel

| | |
| --- | --- |
| Production | https://hausbank-plus-mcp.vercel.app |
| MCP | https://hausbank-plus-mcp.vercel.app/api/mcp |
| Health | https://hausbank-plus-mcp.vercel.app/api/healthz |

## Credentials (Kurz)

| Konnektor | Env |
| --- | --- |
| CB-Connect | `CBCON_*` + Zertifikat |
| SME Deutsche Bank | `SME_DB_CLIENT_ID` / `SECRET` / `REFRESH_TOKEN` / `PUBLIC_ORIGIN` |
| finAPI | `FINAPI_CLIENT_ID` / `SECRET` / `USER_*` |
| Better Payment | `BETTER_PAYMENT_API_KEY` / `OUTGOING_KEY` / `PUBLIC_ORIGIN` |

## Herkunft

Portiert aus `dbHealthflow` (`lib/native-bank-connectivity`, `lib/deutsche-bank-biz`, `lib/finapi`, `lib/better-payment`) und Cash365 BizBankApi — ohne Team-Store, UI, ABAC.

## Lizenz

MIT — siehe [LICENSE](LICENSE).
