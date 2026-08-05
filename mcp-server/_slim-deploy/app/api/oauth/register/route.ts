import { dynamicClientRegistration, oauthEnabled } from "../../../../src/oauth/adapter";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!oauthEnabled()) {
    return Response.json(
      { error: "oauth_not_configured" },
      { status: 503 },
    );
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* empty */
  }
  return Response.json(dynamicClientRegistration(body), { status: 201 });
}
