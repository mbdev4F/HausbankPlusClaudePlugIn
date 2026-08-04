import {
  exchangeSmeDbAuthorizationCode,
  SmeDbApiError,
} from "@/src/sme-deutsche-bank/oauth";
import { CONNECTOR_DISPLAY_NAME } from "@/src/sme-deutsche-bank/shared";

export const runtime = "nodejs";

/**
 * OAuth callback for SME Deutsche Bank Connector.
 * Shows refresh_token once so the operator can store SME_DB_REFRESH_TOKEN.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const state = url.searchParams.get("state");

  if (error) {
    return htmlPage(
      "OAuth fehlgeschlagen",
      `<p><code>${escapeHtml(error)}</code></p><p>${escapeHtml(errorDescription ?? "")}</p>`
    );
  }

  if (!code) {
    return htmlPage(
      "SME Deutsche Bank OAuth",
      "<p>Erwarte Query-Parameter <code>code</code> von der Deutschen Bank.</p>"
    );
  }

  try {
    const redirectUri = `${url.origin}/api/sme-db-oauth/callback`;
    const tokens = await exchangeSmeDbAuthorizationCode(code, redirectUri);
    const refresh = tokens.refresh_token?.trim() ?? "";

    return htmlPage(
      `${CONNECTOR_DISPLAY_NAME} — verbunden`,
      `
      <p>OAuth erfolgreich (state: <code>${escapeHtml(state ?? "—")}</code>).</p>
      <p>Bitte den Refresh-Token als <code>SME_DB_REFRESH_TOKEN</code> in der Server-Env speichern:</p>
      <pre>${escapeHtml(refresh || "(kein refresh_token in der Antwort)")}</pre>
      <p>Access-Token ist kurzlebig und wird nicht angezeigt. Danach <code>sme_db_probe_auth</code> aufrufen.</p>
      `
    );
  } catch (e) {
    const msg =
      e instanceof SmeDbApiError
        ? `${e.message}: ${e.body.slice(0, 300)}`
        : e instanceof Error
          ? e.message
          : String(e);
    return htmlPage("Token-Austausch fehlgeschlagen", `<p>${escapeHtml(msg)}</p>`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlPage(title: string, body: string): Response {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1rem; color: #111; }
    h1 { font-size: 1.35rem; }
    pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; word-break: break-all; white-space: pre-wrap; border-radius: 6px; }
    code { background: #f3f3f3; padding: 0.1rem 0.35rem; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${body}
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
