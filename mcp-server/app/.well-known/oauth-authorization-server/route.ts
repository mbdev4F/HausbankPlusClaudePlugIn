import { authorizationServerMetadata } from "../../../src/oauth/adapter";

export const runtime = "nodejs";

export function GET() {
  return Response.json(authorizationServerMetadata());
}
