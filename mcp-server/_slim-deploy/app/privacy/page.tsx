export default function PrivacyPage() {
  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 720, margin: "2rem auto", padding: "0 1rem", lineHeight: 1.5 }}>
      <h1>HausbankAgent — Privacy Policy</h1>
      <p>Last updated: 2026-08-05</p>

      <h2>Who we are</h2>
      <p>
        HausbankAgent is operated as an MCP connector hosted at{" "}
        <code>hausbank-plus-mcp.vercel.app</code>. Contact via the public GitHub
        repository <code>mbdev4F/HausbankPlusClaudePlugIn</code>.
      </p>

      <h2>Data we process</h2>
      <ul>
        <li>
          <strong>Authentication:</strong> Microsoft Entra OAuth tokens (access /
          refresh) issued for your tenant, used only to call your APIs.
        </li>
        <li>
          <strong>Configuration:</strong> Environment name and Company ID you enter
          at connect time, stored inside the session token Claude holds.
        </li>
        <li>
          <strong>API payloads:</strong> Request/response data from tools you invoke
          (accounts, payments, vendors, etc.) are proxied to your backend and
          returned to Claude. We do not use them for advertising.
        </li>
        <li>
          <strong>Starne Payment Link:</strong> If you use{" "}
          <code>hausbank_agent_starne_payment_link</code>, amount/IBAN/purpose are
          sent to your Hausbank-Agent CloudConnector API (which may call finAPI
          on your behalf).
        </li>
      </ul>

      <h2>Storage & retention</h2>
      <p>
        Session material lives in short-lived signed tokens held by Claude / the
        OAuth flow. Server logs on Vercel may retain request metadata for
        operations and abuse prevention (typically days to weeks per host
        defaults). We do not operate a separate customer database for chat
        content.
      </p>

      <h2>Third parties</h2>
      <ul>
        <li>Microsoft Entra ID (login)</li>
        <li>Your Business Central / Banqr CloudConnector APIs</li>
        <li>Vercel (hosting)</li>
        <li>Anthropic / Claude (MCP client)</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We do not sell personal data. Data is shared only with the services above
        as needed to provide the connector.
      </p>

      <h2>Your rights</h2>
      <p>
        You can disconnect the connector in Claude at any time (tokens stop being
        sent). For deletion of Entra app consent, revoke the app in your Microsoft
        Entra admin center. Contact us via GitHub for privacy requests.
      </p>

      <h2>Security</h2>
      <p>
        Transport is HTTPS. MCP access requires OAuth when configured. Do not share
        client secrets in chat; rotate credentials if exposed.
      </p>

      <p>
        <a href="/docs">Documentation</a> · <a href="/">Home</a>
      </p>
    </main>
  );
}
