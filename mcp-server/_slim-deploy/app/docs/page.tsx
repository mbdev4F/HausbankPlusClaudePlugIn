export default function DocsPage() {
  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 720, margin: "2rem auto", padding: "0 1rem", lineHeight: 1.5 }}>
      <h1>HausbankAgent — Documentation</h1>
      <p>
        HausbankAgent is a remote MCP connector for Claude. After Microsoft Entra
        login it talks to <strong>your</strong> banking/ERP APIs (Banqr CloudConnector)
        in your tenant — including Starne Payment Link for customer payment URLs.
      </p>

      <h2>Connect in Claude</h2>
      <ol>
        <li>Settings → Connectors → Add custom connector (or Directory listing).</li>
        <li>URL: <code>https://hausbank-plus-mcp.vercel.app/api/mcp</code></li>
        <li>Name: <code>HausbankAgent</code></li>
        <li>Authenticate with Microsoft. Enter your Environment name and optional Company GUID.</li>
        <li>Admin consent may be required once per organization.</li>
      </ol>

      <h2>What you need</h2>
      <ul>
        <li>Microsoft Entra / work account with access to your ERP company</li>
        <li>Business Central (or Banqr CloudConnector) environment name</li>
        <li>Company GUID (can be listed after login via <code>hausbank_agent_list_companies</code>)</li>
      </ul>

      <h2>Example prompts</h2>
      <ul>
        <li>„Liste meine HausbankAgent-Firmen und Konten.“</li>
        <li>„Zeige offene Payments und deren Status.“</li>
        <li>„Erstelle einen Starne Payment Link über 50 EUR auf IBAN DE… für Kunde Müller.“</li>
      </ul>

      <h2>Main tools</h2>
      <ul>
        <li><code>hausbank_agent_list_companies</code> / <code>list_accounts</code> / <code>list_payments</code> — read</li>
        <li><code>hausbank_agent_create_payment</code> / <code>approve_payment</code> — write (ERP)</li>
        <li><code>hausbank_agent_starne_payment_link</code> — Starne Payment Link (customer payment URL)</li>
        <li><code>hausbank_agent_probe_auth</code> — session diagnostics</li>
      </ul>

      <h2>Privacy</h2>
      <p>
        See <a href="/privacy">Privacy Policy</a>. Support: use the contact on your
        GitHub repository <code>mbdev4F/HausbankPlusClaudePlugIn</code>.
      </p>
    </main>
  );
}
