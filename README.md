# Hausbank Plus — Claude Plugin

Claude-Plugin + MCP-Connector für **Hausbank Plus** mit Echtzeitanbindung an das globale Setup der **Deutschen Bank** (inkl. **Postbank First**).

Dieses Repo ist ein **Scaffold (v0.1)**. API-Details folgen schrittweise per Postman/Swagger; Signierungs-Framework und Zertifikate kommen in späteren Iterationen.

## Architektur-Entscheidung: MCP + Plugin (beides)

Nach [Anthropic Best Practice](https://claude.com/docs/connectors/building/what-to-build):

| Baustein | Rolle |
| --- | --- |
| **Remote MCP-Server** | Claude ruft Tools auf (Saldo, Auszüge, ZIPA, VoP, Freigabe, SWIFT, FX). Hier leben **mTLS**, Zertifikat und **Request-Signing**. |
| **Plugin + Skills** | Claude kennt die **Workflows** (mehrstufige Freigabe, VoP vor Versand, Statusabfragen). |

**Warum nicht nur Skills?** Die Bank-APIs erfordern Client-Zertifikat und komplexe Signierung. Das gehört nicht in den Chat-Kontext, sondern in Server-Code. Skills allein können mTLS nicht sicher halten.

**Warum nicht nur MCP?** Ohne Skills rät Claude bei Freigabe-/VoP-/ZIPA-Abläufen. Skills machen daraus einen fachlichen Specialist.

```
┌─────────────┐     Skills / Commands      ┌──────────────────┐
│ Claude.ai / │ ─────────────────────────► │ hausbank-plus    │
│ Cowork /    │                            │ Plugin           │
│ Claude Code │ ◄─── MCP tools (HTTP) ──── │ .mcp.json        │
└─────────────┘                            └────────┬─────────┘
                                                    │
                                           ┌────────▼─────────┐
                                           │ MCP Server       │
                                           │ (mTLS + Signing) │
                                           └────────┬─────────┘
                                                    │
                              ┌─────────────────────▼─────────────────────┐
                              │ Deutsche Bank Global / Postbank First API │
                              └───────────────────────────────────────────┘
```

## Capabilities (geplant)

| Skill / Tool-Gruppe | Status |
| --- | --- |
| Echtzeit-Saldo (Realtime Balance) | Scaffold |
| Globale Kontoauszüge (Account Statements) | Scaffold |
| ZIPA-Zahlung anlegen | Scaffold |
| Verification of Pay (VoP) | Scaffold |
| Mehrstufige Freigabe → Versand an Deutsche Bank | Scaffold |
| SWIFT-Status ausgeführter Zahlungen | Scaffold |
| FX-Forward initiieren | Scaffold |

## Repository-Struktur

```
.claude-plugin/plugin.json   # Plugin-Manifest
.mcp.json                    # MCP-Connector-Referenz (URL via Env)
skills/                      # Workflow-Wissen für Claude
commands/                    # Slash-Commands
agents/                      # Spezial-Agent für Zahlungsabläufe
mcp-server/                  # TypeScript MCP-Server (Stubs)
docs/                        # Architektur, Zertifikate, API-Specs
```

## Zertifikate: Datei vs. Azure Key Vault

| Umgebung | Empfehlung |
| --- | --- |
| **Lokal / Sandbox** | Zertifikat + Key als Datei unter `./certs/` (gitignored), Pfade über `.env`. Schnell zum Testen. |
| **Produktion / geteilter MCP** | **Azure Key Vault** (oder vergleichbarer HSM/KMS). Private Key verlässt den Vault nicht; Signierung über Key Vault Crypto API bzw. Certificate + Managed Identity. |

**Tipp:** Starte mit `CERT_PROVIDER=file`, baue Signing ein, wenn du den Code-Ausschnitt lieferst. Für den produktiven Remote-MCP-Server auf `azure-keyvault` umstellen — niemals Bank-Client-Keys auf App-Disk in Production ablegen.

Details: [docs/certificates.md](docs/certificates.md)

## Schnellstart (Scaffold)

```bash
# 1. Repo klonen
git clone https://github.com/mbdev4F/HausbankPlusClaudePlugIn.git
cd HausbankPlusClaudePlugIn

# 2. MCP-Server (noch Stubs — APIs folgen)
cd mcp-server
cp ../.env.example .env
npm install
npm run dev

# 3. Plugin in Claude Code testen
claude --plugin-dir ..
```

Plugin-Setup-Anleitung für Claude: Skill `setup` bzw. [skills/setup/SKILL.md](skills/setup/SKILL.md).

## Nächste Schritte (mit dir)

1. Postman-/Swagger-Specs → `docs/api-specs/`
2. Signing-/mTLS-Codebeispiel → `mcp-server/src/auth/signing.ts`
3. Tools konkret verdrahten (nicht mehr Stub)
4. Remote-Deploy (z. B. Azure Container Apps) + Key Vault
5. Optional: Submission an Claude Plugin Directory / Connectors Directory

## Sicherheit

- Keine Secrets im Git
- Schreibende Tools (`create_zipa_payment`, `approve_payment`, `initiate_fx_forward`) sind als **destructive** markiert
- Mehrstufige Freigabe und VoP sind in Skills **Pflichtschritte** vor dem Versand

## Lizenz

MIT — siehe [LICENSE](LICENSE).
