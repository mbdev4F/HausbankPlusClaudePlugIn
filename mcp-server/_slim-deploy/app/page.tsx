export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>HausbankAgent</h1>
      <p>Remote MCP connector for Claude Cloud.</p>
      <ul>
        <li>
          MCP: <code>https://hausbank-plus-mcp.vercel.app/api/mcp</code>
        </li>
        <li>
          <a href="/docs">Documentation</a>
        </li>
        <li>
          <a href="/privacy">Privacy Policy</a>
        </li>
      </ul>
      <h2>Entra redirect URI</h2>
      <p>
        <code>https://hausbank-plus-mcp.vercel.app/api/oauth/callback</code>
      </p>
    </main>
  );
}
