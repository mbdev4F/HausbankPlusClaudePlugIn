export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-16 sm:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-moss">
        MCP Connector
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-forest-deep">
        HausbankAgent
      </h1>
      <p className="mt-4 text-lg text-ink-muted">
        Remote MCP for Claude Cloud — Entra OAuth, your Azure cloud banking stack.
      </p>
      <ul className="mt-8 space-y-3 text-ink-muted">
        <li>
          MCP:{" "}
          <code className="rounded bg-highlight px-1.5 py-0.5 text-forest">
            https://hausbank-plus-mcp.vercel.app/api/mcp
          </code>
        </li>
        <li>
          <a className="font-medium text-moss hover:underline" href="/docs">
            Documentation (DE / EN)
          </a>
        </li>
        <li>
          <a className="font-medium text-moss hover:underline" href="/privacy">
            Privacy Policy
          </a>
        </li>
      </ul>
    </main>
  );
}
