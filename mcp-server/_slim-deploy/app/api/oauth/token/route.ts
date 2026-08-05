import { handleTokenRequest, oauthEnabled } from "../../../../src/oauth/adapter";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!oauthEnabled()) {
    return Response.json({ error: "oauth_not_configured" }, { status: 503 });
  }
  try {
    const ct = req.headers.get("content-type") ?? "";
    let form: URLSearchParams;
    if (ct.includes("application/json")) {
      const json = (await req.json()) as Record<string, string>;
      form = new URLSearchParams();
      for (const [k, v] of Object.entries(json)) {
        if (v != null) form.set(k, String(v));
      }
    } else {
      form = new URLSearchParams(await req.text());
    }
    const result = await handleTokenRequest(form);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      {
        error: "invalid_grant",
        error_description: e instanceof Error ? e.message : String(e),
      },
      { status: 400 },
    );
  }
}
