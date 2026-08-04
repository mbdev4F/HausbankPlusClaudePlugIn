# API-Integration

Hier landen die Spezifikationen, die du Stück für Stück lieferst.

## Ablage

| Datei / Ordner | Inhalt |
| --- | --- |
| `docs/api-specs/README.md` | Diese Übersicht |
| `docs/api-specs/balances.openapi.yaml` | (folgt) Realtime Balance / Accounts |
| `docs/api-specs/statements.openapi.yaml` | (folgt) Global Account Statements |
| `docs/api-specs/payments-SEPA.openapi.yaml` | (folgt) SEPA Payments |
| `docs/api-specs/vop.openapi.yaml` | (folgt) Verification of Pay |
| `docs/api-specs/approvals.openapi.yaml` | (folgt) Mehrstufige Freigabe |
| `docs/api-specs/swift-status.openapi.yaml` | (folgt) SWIFT Payment Status |
| `docs/api-specs/fx-forward.openapi.yaml` | (folgt) FX Forward |
| `docs/api-specs/_private/` | Lokale Postman-Exporte mit Tokens — **gitignored** |

## Was ich brauche pro API

1. OpenAPI/Swagger **oder** Postman Collection (Export)
2. Base URL Sandbox + Prod
3. Auth: mTLS-only oder mTLS + zusätzliche Headers/Signing
4. Beispiel Request/Response (happy path + 1 Fehlerfall)
5. Idempotency-Keys / Correlation-IDs falls vorhanden

## Mapping auf MCP-Tools

Sobald Specs da sind, wird jede Operation auf genau ein Tool (oder eine kleine Tool-Gruppe) gemappt — keine monolitischen „do_everything“-Tools. Siehe [architecture.md](architecture.md).
