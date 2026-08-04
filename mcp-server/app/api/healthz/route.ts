export const runtime = "nodejs";

export function GET() {
  return Response.json({
    ok: true,
    service: "HausbankAgent",
    certProvider: process.env.CERT_PROVIDER ?? "file",
  });
}
