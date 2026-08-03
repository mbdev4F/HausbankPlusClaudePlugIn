export default function HomePage() {
  return (
    <main>
      <h1>Deutsche Bank CB-Connect MCP</h1>
      <p>
        Streamable HTTP endpoint: <code>/api/mcp</code>
      </p>
      <p>
        Health check: <code>/api/healthz</code>
      </p>
      <p>
        Set <code>CB_CONNECT_MCP_TOKEN</code> (or <code>HAUSBANK_PLUS_MCP_TOKEN</code>) on
        Vercel, then point Claude at this deployment.
      </p>
    </main>
  );
}
