# Zertifikate & Signierung

## Kurzempfehlung

| Phase | Provider | Begründung |
| --- | --- | --- |
| Entwicklung / Sandbox | `CERT_PROVIDER=file` | Schnell, kein Azure nötig, Keys nur lokal und gitignored |
| Produktion / Shared MCP | `CERT_PROVIDER=azure-keyvault` | Key bleibt im Vault/HSM, Rotation, Audit, Managed Identity |

**Nicht empfohlen für Production:** Private Keys dauerhaft auf Container-Disk oder in Image-Layern.

## Local File Provider

```bash
mkdir -p certs
# client.pem + client.key oder client.pfx ablegen (nie committen)
cp .env.example mcp-server/.env
# CERT_PROVIDER=file setzen und Pfade prüfen
```

Der MCP-Server lädt Zertifikat + Key und baut einen HTTPS-Agent mit mTLS zum Bank-API-Host.

## Azure Key Vault Provider

Geplante Variante (Code-Stub in `mcp-server/src/auth/certificate.ts`):

1. Zertifikat inkl. Private Key in Key Vault speichern (Certificate oder Key + Secret)
2. MCP-Runtime (Azure Container Apps / App Service / VM) mit **Managed Identity**
3. Identity darf `get` auf Certificate / `sign` auf Key
4. Für mTLS: Zertifikat materialisieren nur im Memory (oder Key Vault TLS-Integration nutzen)
5. Für Request-Signing: idealerweise **Sign-Operation im Vault**, ohne Key-Export

Wenn euer Signing-Framework zwingend einen lokalen Key braucht: kurzzeitig aus Vault laden, im Memory halten, Prozess-Hardening (kein Swap-Dump, kurze Lifetime). Langfristig Signing-API des Vaults bevorzugen.

## Request-Signing

`SIGNING_MODE=stub` ist Platzhalter. Sobald du das Code-Framework lieferst:

- Interface bleibt `SigningProvider.sign(payload) → headers/body`
- Implementierung kommt nach `mcp-server/src/auth/signing.ts`
- Unit-Tests mit Fixtures (keine echten Bank-Keys)

## Checkliste vor Go-Live

- [ ] Keine Certs im Git (`git status` sauber)
- [ ] Key Vault Access Policies / RBAC least privilege
- [ ] Separates Sandbox- vs. Prod-Zertifikat
- [ ] Audit-Logging für destructive Tools
- [ ] Token/OAuth vor dem öffentlichen MCP-Endpoint
