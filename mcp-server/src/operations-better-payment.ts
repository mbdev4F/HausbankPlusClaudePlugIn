/**
 * Thin MCP-facing operations over Better Payment (Wero + Pay by Bank / RTP).
 * Credentials from BETTER_PAYMENT_* env — no team store / Zahlungslink token DB.
 */

import { randomBytes } from "node:crypto";
import {
  BetterPaymentApiError,
  betterPaymentCreatePayment,
  betterPaymentFindTransactionsByOrderId,
  betterPaymentGetTransaction,
  betterPaymentProbeAuth,
} from "./better-payment/api-client.js";
import {
  hasBetterPaymentEnv,
  readBetterPaymentEnv,
} from "./better-payment/env-config.js";
import {
  betterPaymentGetResolvedCredentials,
  validateBetterPaymentCredentials,
} from "./better-payment/resolved-credentials.js";
import {
  BETTER_PAYMENT_METHODS,
  isBetterPaymentPaidStatus,
  resolveBetterPaymentMethodId,
  type BetterPaymentMethodId,
} from "./better-payment/shared.js";

function splitDebtorName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Kunde", lastName: "Zahlung" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "Zahlung" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function requireHttpsUrl(label: string, url: string): string {
  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${label} ist keine gültige URL.`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${label} muss https:// sein (Better Payment error_code 149).`);
  }
  return trimmed;
}

function defaultOrderId(reference?: string): string {
  const ref = reference?.trim();
  if (ref) return ref.slice(0, 64);
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `ZL-${day}-${suffix}`;
}

function resolveCallbackUrls(args: {
  successUrl?: string;
  errorUrl?: string;
  postbackUrl?: string;
  weroCheckoutUrl?: string;
  method: BetterPaymentMethodId;
  orderId: string;
}): {
  successUrl: string;
  errorUrl: string;
  postbackUrl: string;
  weroCheckoutUrl: string;
} {
  const creds = betterPaymentGetResolvedCredentials();
  const origin = creds.publicOrigin;

  const successUrl = args.successUrl?.trim()
    ? requireHttpsUrl("successUrl", args.successUrl)
    : origin
      ? `${origin}/api/better-payment/return?result=success&order_id=${encodeURIComponent(args.orderId)}&method=${args.method}`
      : "";
  const errorUrl = args.errorUrl?.trim()
    ? requireHttpsUrl("errorUrl", args.errorUrl)
    : origin
      ? `${origin}/api/better-payment/return?result=error&order_id=${encodeURIComponent(args.orderId)}&method=${args.method}`
      : "";
  const postbackUrl = args.postbackUrl?.trim()
    ? requireHttpsUrl("postbackUrl", args.postbackUrl)
    : origin
      ? `${origin}/api/better-payment/postback`
      : "";

  if (!successUrl || !errorUrl || !postbackUrl) {
    throw new Error(
      "successUrl, errorUrl und postbackUrl (HTTPS) sind Pflicht — entweder explizit übergeben oder BETTER_PAYMENT_PUBLIC_ORIGIN setzen."
    );
  }

  const weroCheckoutUrl = args.weroCheckoutUrl?.trim()
    ? requireHttpsUrl("weroCheckoutUrl", args.weroCheckoutUrl)
    : successUrl;

  return { successUrl, errorUrl, postbackUrl, weroCheckoutUrl };
}

export async function betterPaymentProbe() {
  const env = readBetterPaymentEnv();
  const creds = betterPaymentGetResolvedCredentials();
  const validationError = validateBetterPaymentCredentials(creds);

  let authOk = false;
  let authError: string | null = null;
  let authStatus: number | null = null;

  if (!validationError) {
    try {
      const probe = await betterPaymentProbeAuth(creds);
      authOk = true;
      authStatus = probe.status;
    } catch (e) {
      authError =
        e instanceof BetterPaymentApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);
      if (e instanceof BetterPaymentApiError) authStatus = e.status;
    }
  }

  return {
    ok: authOk,
    hasEnvCredentials: hasBetterPaymentEnv(),
    environment: env.environment,
    apiBaseUrl: env.apiBaseUrl,
    apiKeyPresent: Boolean(env.apiKey),
    outgoingKeyPresent: Boolean(env.outgoingKey),
    incomingKeyPresent: Boolean(env.incomingKey),
    publicOrigin: env.publicOrigin,
    validationError,
    authOk,
    authError,
    authStatus,
    methods: BETTER_PAYMENT_METHODS.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      aliases: m.aliases,
    })),
  };
}

export function betterPaymentListMethods() {
  return {
    ok: true,
    methods: BETTER_PAYMENT_METHODS.map((m) => ({
      id: m.id,
      paymentType: m.paymentType,
      title: m.title,
      description: m.description,
      aliases: m.aliases,
    })),
  };
}

export async function createPaymentLink(args: {
  method: string;
  amount: number;
  currency?: string;
  reference?: string;
  merchantReference?: string;
  debtorName?: string;
  debtorEmail?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  successUrl?: string;
  errorUrl?: string;
  postbackUrl?: string;
  weroCheckoutUrl?: string;
}) {
  const method = resolveBetterPaymentMethodId(args.method);
  if (!method) {
    throw new Error(
      `Unbekannte Zahlungsmethode "${args.method}". Erlaubt: wero|vero, rtp|pay_by_bank.`
    );
  }
  if (!(args.amount > 0)) {
    throw new Error("amount muss > 0 sein (Major Units, z. B. 12.5 für 12,50 EUR).");
  }

  const creds = betterPaymentGetResolvedCredentials();
  const credErr = validateBetterPaymentCredentials(creds);
  if (credErr) throw new Error(credErr);

  const orderId = defaultOrderId(args.reference);
  const callbacks = resolveCallbackUrls({
    ...args,
    method,
    orderId,
  });

  let firstName = args.firstName?.trim();
  let lastName = args.lastName?.trim();
  if (!firstName || !lastName) {
    const split = splitDebtorName(args.debtorName ?? "");
    firstName = firstName || split.firstName;
    lastName = lastName || split.lastName;
  }

  const meta = BETTER_PAYMENT_METHODS.find((m) => m.id === method)!;
  const { data, requestBody } = await betterPaymentCreatePayment(creds, {
    paymentType: method,
    amount: args.amount,
    currency: (args.currency ?? "EUR").toUpperCase(),
    orderId,
    merchantReference: (args.merchantReference ?? orderId).slice(0, 140),
    successUrl: callbacks.successUrl,
    errorUrl: callbacks.errorUrl,
    postbackUrl: callbacks.postbackUrl,
    weroCheckoutUrl: callbacks.weroCheckoutUrl,
    billing: {
      firstName,
      lastName,
      email: args.debtorEmail?.trim() || undefined,
      address: args.address?.trim() || "—",
      city: args.city?.trim() || "—",
      postalCode: args.postalCode?.trim() || "00000",
      country: (args.country?.trim() || "DE").toUpperCase(),
    },
  });

  const redirectUrl =
    typeof data.action_data?.url === "string" ? data.action_data.url.trim() : "";
  if (!redirectUrl) {
    throw new Error(
      `${meta.title} hat keine Redirect-URL zurückgegeben — Payment-Link konnte nicht erzeugt werden.`
    );
  }

  return {
    ok: true,
    method,
    methodTitle: meta.title,
    paymentLinkUrl: redirectUrl,
    transactionId:
      typeof data.transaction_id === "string" ? data.transaction_id : null,
    orderId: typeof data.order_id === "string" ? data.order_id : orderId,
    status: typeof data.status === "string" ? data.status : null,
    statusCode:
      typeof data.status_code === "number" ? data.status_code : null,
    clientAction:
      typeof data.client_action === "string" ? data.client_action : null,
    callbacks,
    note: "Zahler öffnet paymentLinkUrl im Browser (Redirect zu Wero / Pay by Bank). Status per get_payment_link_status oder Postback.",
    request: {
      payment_type: requestBody.payment_type,
      amount: requestBody.amount,
      currency: requestBody.currency,
      order_id: requestBody.order_id,
    },
  };
}

export async function getPaymentLinkStatus(args: {
  transactionId?: string;
  orderId?: string;
}) {
  const creds = betterPaymentGetResolvedCredentials();
  const credErr = validateBetterPaymentCredentials(creds);
  if (credErr) throw new Error(credErr);

  const txId = args.transactionId?.trim();
  const orderId = args.orderId?.trim();
  if (!txId && !orderId) {
    throw new Error("transactionId oder orderId ist erforderlich.");
  }

  let transactions =
    txId != null
      ? [await betterPaymentGetTransaction(creds, txId)]
      : await betterPaymentFindTransactionsByOrderId(creds, orderId!);

  if (transactions.length === 0) {
    return {
      ok: true,
      found: false,
      transactionId: txId ?? null,
      orderId: orderId ?? null,
      paid: false,
      message: "Keine Transaktion gefunden.",
    };
  }

  const primary = transactions[0]!;
  const status =
    typeof primary.status === "string" ? primary.status : null;
  const statusCode =
    typeof primary.status_code === "number" ? primary.status_code : null;

  return {
    ok: true,
    found: true,
    transactionId:
      typeof primary.transaction_id === "string"
        ? primary.transaction_id
        : txId ?? null,
    orderId:
      typeof primary.order_id === "string" ? primary.order_id : orderId ?? null,
    status,
    statusCode,
    paid: isBetterPaymentPaidStatus(status, statusCode),
    amount: typeof primary.amount === "number" ? primary.amount : null,
    currency: typeof primary.currency === "string" ? primary.currency : null,
    paymentMethod:
      typeof primary.payment_type === "string" ? primary.payment_type : null,
    merchantReference:
      typeof primary.merchant_reference === "string"
        ? primary.merchant_reference
        : null,
    transactions,
  };
}
