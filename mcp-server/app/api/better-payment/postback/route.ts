import { isBetterPaymentPaidStatus } from "@/src/better-payment/shared";

export const runtime = "nodejs";

/**
 * Better Payment Postback (Webhook).
 * Acknowledges notification; MCP has no Zahlungslink store — use get_payment_link_status to poll.
 */
async function parseBody(request: Request): Promise<Record<string, unknown>> {
  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    bodyText = "";
  }

  try {
    return bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
  } catch {
    try {
      const params = new URLSearchParams(bodyText);
      const payload: Record<string, unknown> = {};
      for (const [k, v] of params.entries()) payload[k] = v;
      return payload;
    } catch {
      return {};
    }
  }
}

export async function POST(request: Request) {
  const payload = await parseBody(request);

  const orderId =
    (typeof payload.order_id === "string" && payload.order_id) ||
    (typeof payload.merchant_reference === "string" &&
      payload.merchant_reference) ||
    null;
  const transactionId =
    typeof payload.transaction_id === "string" ? payload.transaction_id : null;
  const status = typeof payload.status === "string" ? payload.status : null;
  const statusCodeRaw = payload.status_code;
  const statusCode =
    typeof statusCodeRaw === "number"
      ? statusCodeRaw
      : typeof statusCodeRaw === "string" && /^\d+$/.test(statusCodeRaw)
        ? Number(statusCodeRaw)
        : null;

  console.info("[better-payment/postback]", {
    orderId,
    transactionId,
    status,
    statusCode,
    paid: isBetterPaymentPaidStatus(status, statusCode),
    signature: request.headers.get("gateway-webhook-signature"),
  });

  return Response.json(
    {
      ok: true,
      received: true,
      orderId,
      transactionId,
      status,
      statusCode,
      paid: isBetterPaymentPaidStatus(status, statusCode),
    },
    { status: 200 }
  );
}

export async function GET() {
  return Response.json({
    ok: true,
    service: "better-payment-postback",
  });
}
