export default function PrivacyPage() {
  return (
    <main className="relative mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-moss">
        Privacy
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-forest-deep">
        HausbankAgent — Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: 2026-08-05</p>

      <div className="mt-8 space-y-6 text-ink-muted leading-relaxed">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-forest">
            Who we are
          </h2>
          <p className="mt-2">
            HausbankAgent is an MCP connector hosted at{" "}
            <code className="rounded bg-highlight px-1">hausbank-plus-mcp.vercel.app</code>.
            Contact via the public GitHub repository{" "}
            <code className="rounded bg-highlight px-1">mbdev4F/HausbankPlusClaudePlugIn</code>.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-forest">
            Data we process
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Authentication:</strong> Microsoft Entra
              OAuth tokens for your tenant, used only to call your APIs.
            </li>
            <li>
              <strong className="text-ink">Configuration:</strong> Environment name and
              Company ID entered at connect time, carried in the session token held by
              Claude.
            </li>
            <li>
              <strong className="text-ink">API payloads:</strong> Tool request/response
              data (accounts, payments, vendors, …) proxied to your backend and returned
              to Claude. Not used for advertising.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-forest">
            Storage & retention
          </h2>
          <p className="mt-2">
            Session material lives in short-lived signed tokens. Hosting logs on Vercel
            may retain request metadata for operations and abuse prevention. We do not
            operate a separate customer database for chat content.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-forest">
            Third parties
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Microsoft Entra ID (login)</li>
            <li>Your Banqr CloudConnector / ERP APIs</li>
            <li>Vercel (hosting)</li>
            <li>Anthropic / Claude (MCP client)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-forest">
            Your rights
          </h2>
          <p className="mt-2">
            Disconnect the connector in Claude anytime. Revoke the Entra app in your
            Microsoft admin center to remove consent. Contact via GitHub for privacy
            requests.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-moss">
        <a className="hover:underline" href="/docs">
          Documentation
        </a>{" "}
        ·{" "}
        <a className="hover:underline" href="/">
          Home
        </a>
      </p>
    </main>
  );
}
