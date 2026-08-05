import { finishEntraCallback, oauthEnabled } from "../../../../src/oauth/adapter";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!oauthEnabled()) {
    return new Response("OAuth not configured", { status: 503 });
  }
  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  const desc = url.searchParams.get("error_description");
  if (err) {
    return new Response(
      `Entra error: ${err}${desc ? ` — ${desc}` : ""}`,
      { status: 400 },
    );
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return new Response("Missing code/state", { status: 400 });
  }
  try {
    const { redirectTo } = await finishEntraCallback({ code, state });
    return Response.redirect(redirectTo, 302);
  } catch (e) {
    return new Response(
      e instanceof Error ? e.message : String(e),
      { status: 400 },
    );
  }
}
