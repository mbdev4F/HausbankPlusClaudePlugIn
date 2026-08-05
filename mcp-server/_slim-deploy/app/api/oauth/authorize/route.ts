import { oauthEnabled } from "../../../../src/oauth/adapter";
import { oauthCallbackUrl } from "../../../../src/oauth/config";

export const runtime = "nodejs";

function htmlPage(inner: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>HausbankAgent verbinden</title>
<style>
body{font-family:system-ui,sans-serif;max-width:28rem;margin:2.5rem auto;padding:0 1rem;line-height:1.45;color:#111}
h1{font-size:1.35rem;margin:0 0 .5rem}
p{color:#444;font-size:.95rem}
label{display:block;font-weight:600;margin:1rem 0 .35rem;font-size:.9rem}
input{width:100%;box-sizing:border-box;padding:.55rem .65rem;border:1px solid #ccc;border-radius:6px;font-size:1rem}
button{margin-top:1.25rem;width:100%;padding:.7rem;border:0;border-radius:6px;background:#0b3d2e;color:#fff;font-weight:600;font-size:1rem;cursor:pointer}
.hint{font-size:.8rem;color:#666;margin:.25rem 0 0;font-weight:400}
.err{background:#fee;border:1px solid #f99;padding:.75rem;border-radius:6px;margin-bottom:1rem}
code{font-size:.85em;background:#f4f4f4;padding:.1rem .3rem;border-radius:3px}
</style></head><body>${inner}</body></html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

export async function GET(req: Request) {
  if (!oauthEnabled()) {
    return htmlPage(
      `<h1>OAuth nicht konfiguriert</h1><p>Bitte <code>ENTRA_CLIENT_ID</code> und <code>ENTRA_CLIENT_SECRET</code> auf Vercel setzen. Redirect URI in Entra: <code>${oauthCallbackUrl()}</code></p>`,
      503,
    );
  }

  const url = new URL(req.url);
  const redirectUri = url.searchParams.get("redirect_uri") ?? "";
  const clientId = url.searchParams.get("client_id") ?? "hausbank-agent-claude";
  const state = url.searchParams.get("state") ?? "";
  const codeChallenge = url.searchParams.get("code_challenge") ?? "";
  const method = url.searchParams.get("code_challenge_method") ?? "S256";
  const err = url.searchParams.get("error");

  if (!redirectUri || !state || !codeChallenge) {
    return htmlPage(
      `<h1>Ungültige Anfrage</h1><p>Claude muss <code>redirect_uri</code>, <code>state</code> und <code>code_challenge</code> senden.</p>`,
      400,
    );
  }
  if (method && method !== "S256") {
    return htmlPage(`<h1>Nur PKCE S256 wird unterstützt</h1>`, 400);
  }

  const errBlock = err
    ? `<div class="err">${String(err)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</div>`
    : "";

  return htmlPage(`
    <h1>HausbankAgent verbinden</h1>
    <p>Nach dem Login bei Microsoft (Entra) greift Claude auf <strong>Ihren</strong> Business-Central-Tenant zu.</p>
    ${errBlock}
    <form method="POST" action="/api/oauth/authorize">
      <input type="hidden" name="redirect_uri" value="${redirectUri.replace(/"/g, "&quot;")}" />
      <input type="hidden" name="client_id" value="${clientId.replace(/"/g, "&quot;")}" />
      <input type="hidden" name="state" value="${state.replace(/"/g, "&quot;")}" />
      <input type="hidden" name="code_challenge" value="${codeChallenge.replace(/"/g, "&quot;")}" />
      <label>Environment-Name
        <span class="hint">z. B. Production, Sandbox — wie in Microsoft 365</span>
        <input name="environmentName" required autocomplete="off" placeholder="Production" />
      </label>
      <label>Company-ID (GUID)
        <span class="hint">Company-GUID aus BC. Kann leer bleiben und später per Tool gesetzt werden.</span>
        <input name="companyId" autocomplete="off" placeholder="00000000-0000-0000-0000-000000000000" />
      </label>
      <button type="submit">Mit Microsoft anmelden</button>
    </form>
  `);
}

export async function POST(req: Request) {
  if (!oauthEnabled()) {
    return htmlPage(`<h1>OAuth nicht konfiguriert</h1>`, 503);
  }

  const form = await req.formData();
  const redirectUri = String(form.get("redirect_uri") ?? "");
  const clientId = String(form.get("client_id") ?? "hausbank-agent-claude");
  const state = String(form.get("state") ?? "");
  const codeChallenge = String(form.get("code_challenge") ?? "");
  const environmentName = String(form.get("environmentName") ?? "").trim();
  const companyId = String(form.get("companyId") ?? "").trim();

  if (!redirectUri || !state || !codeChallenge || !environmentName) {
    return htmlPage(
      `<h1>Angaben unvollständig</h1><p>Environment-Name ist Pflicht.</p><p><a href="javascript:history.back()">Zurück</a></p>`,
      400,
    );
  }

  const { beginEntraAuthorize } = await import("../../../../src/oauth/adapter");
  const entraUrl = beginEntraAuthorize({
    redirectUri,
    clientId,
    codeChallenge,
    claudeState: state,
    environmentName,
    companyId,
  });
  return Response.redirect(entraUrl, 302);
}
