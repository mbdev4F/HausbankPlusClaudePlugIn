export default function HomePage() {
  return (
    <main>
      <h1>HausbankAgent</h1>
      <p>Endpoint: <code>/api/mcp</code></p>
      <h2>Entra-App (Redirect-URI)</h2>
      <p>
        In der App-Registrierung unter <strong>Umleitungs-URI</strong>{" "}
        (Web) eintragen:
      </p>
      <p>
        <code>https://hausbank-plus-mcp.vercel.app/api/oauth/callback</code>
      </p>
      <p>
        Kontotyp: <em>Konten in einem beliebigen Organisationsverzeichnis
        (beliebiger Microsoft Entra-ID-Mandant)</em>. API-Berechtigung: Dynamics
        365 Business Central → <code>user_impersonation</code> (delegiert) +
        Admin-Zustimmung.
      </p>
      <p>
        Vercel-Env: <code>ENTRA_CLIENT_ID</code>,{" "}
        <code>ENTRA_CLIENT_SECRET</code>,{" "}
        <code>OAUTH_SIGNING_SECRET</code>,{" "}
        <code>HAUSBANK_AGENT_PUBLIC_ORIGIN=https://hausbank-plus-mcp.vercel.app</code>
      </p>
    </main>
  );
}
