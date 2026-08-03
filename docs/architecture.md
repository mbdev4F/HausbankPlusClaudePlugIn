# Architektur

MCP-Server wrappt portierte **dbHealthflow** CB-Connect-Module.

- Auth: OAuth client-credentials + mTLS PKCS#12 + HTTP Signature (RSA-SHA256)
- Endpoints: Sandbox-Defaults aus HealthFlow, override via `CBCON_URL_*`
- Kein Next.js Team-Store — Credentials nur aus Env

Siehe Root-README für Tool-Liste.
