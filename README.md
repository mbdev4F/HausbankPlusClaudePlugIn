# HausbankAgent — Claude Connector + Plugin

**HausbankAgent** ist die Embedded-Banking-Schicht: vor allem **Deutsche-Bank-Fähigkeiten**, additiv per **PSD2-Connector** Zugriff auf ca. **9.200 europäische Banken**. Die App bündelt Multi-Banking (Kontoauszüge, Kontodaten, Zahlungsprozesse); Connector + Plugin machen diese Fähigkeiten in Claude nutzbar.

**Plugin hilft Claude**, den Konnektor bestmöglich auszuschöpfen:

- Setup / Auth (Entra)
- Bank-Dashboard (Konten, Salden, Umsätze)
- Vendors & Customers (Stammdaten, auch aus ERP-Konnektor)
- Payment Drafts + Freigabe (`approve`) + **Send to Bank** (`send_payment_to_bank`)
- SWIFT / UETR über Payment Tracker (G4C)

Starne Payment Links sind **nicht** Teil des Standard-Plugin-Scopes (API noch nicht produktiv).

## Architektur

| Schicht | Rolle |
| --- | --- |
| **MCP-Server** (`mcp-server/`) | Live-Tools auf Vercel |
| **Plugin** (Repo-Root) | Skills, Slash-Commands, Agent — Workflows für Claude Code / Cowork |
| **Hausbank-Agent** | CloudConnector APIs hinter den `hausbank_agent_*` Tools |

```
Claude ──► Plugin (Skills) ──► MCP ──► Hausbank-Agent
```

Weitere Legacy-Konnektoren im Code unter `mcp-server/src/` sind nicht der Live-Plugin-Fokus; Live läuft über HausbankAgent (Deutsche Bank + PSD2 Multi-Banking).

## Plugin-Skills

| Skill | Aufgabe |
| --- | --- |
| `setup` | Einmalige Einrichtung |
| `bank-dashboard` | Salden + Umsätze |
| `vendors-customers` | Kreditoren / Debitoren |
| `payment-drafts` | Entwürfe + Freigabe + Send to Bank |
| `swift-uetr` | Internationale Zahlung per UETR / G4C |

## Schnellstart MCP

```bash
cd mcp-server
cp ../.env.example .env
npm install
npm run dev
# → http://localhost:8787/api/mcp  |  /api/healthz
```

### Vercel

| | |
| --- | --- |
| Production | https://hausbank-plus-mcp.vercel.app |
| MCP | https://hausbank-plus-mcp.vercel.app/api/mcp |
| Health | https://hausbank-plus-mcp.vercel.app/api/healthz |

## Plugin nutzen

Siehe [SETUP.md](SETUP.md) — lokal `claude --plugin-dir .` oder Marketplace aus diesem Repo.

## Herkunft

Portiert aus `dbHealthflow` / Cash365 — ohne Team-Store, UI, ABAC. Live-Oberfläche: Hausbank-Agent.

## Lizenz

MIT — siehe [LICENSE](LICENSE).
