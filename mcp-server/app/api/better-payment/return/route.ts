export const runtime = "nodejs";

/**
 * Browser return landing after Wero / Pay by Bank redirect.
 * Better Payment requires https success/error URLs; this is a minimal ack page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = url.searchParams.get("result") ?? "unknown";
  const orderId = url.searchParams.get("order_id");
  const method = url.searchParams.get("method");

  const title =
    result === "success"
      ? "Zahlung abgeschlossen"
      : result === "error"
        ? "Zahlung fehlgeschlagen"
        : "Zahlung";

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem; color: #111; }
    h1 { font-size: 1.35rem; }
    p { color: #444; line-height: 1.5; }
    code { background: #f3f3f3; padding: 0.1rem 0.35rem; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Methode: <code>${method ?? "—"}</code></p>
  <p>Order-ID: <code>${orderId ?? "—"}</code></p>
  <p>Sie können dieses Fenster schließen. Der Status kann über das MCP-Tool <code>get_payment_link_status</code> abgefragt werden.</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
