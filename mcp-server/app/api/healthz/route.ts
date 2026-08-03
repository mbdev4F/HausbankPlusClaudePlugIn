export const runtime = "nodejs";

export function GET() {
  return Response.json({
    ok: true,
    service: "db-cb-connect-mcp",
    certProvider: process.env.CERT_PROVIDER ?? "file",
  });
}
