import type { BetterPaymentMethodId } from "./shared.js";

export type BetterPaymentCredentials = {
  apiKey: string;
  outgoingKey: string;
  apiBaseUrl: string;
};

export class BetterPaymentApiError extends Error {
  status: number;
  bodyText: string;

  constructor(message: string, status: number, bodyText: string) {
    super(message);
    this.name = "BetterPaymentApiError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

function basicAuthHeader(apiKey: string, outgoingKey: string): string {
  const token = Buffer.from(`${apiKey}:${outgoingKey}`, "utf8").toString(
    "base64"
  );
  return `Basic ${token}`;
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function betterPaymentFetch(
  creds: BetterPaymentCredentials,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = joinUrl(creds.apiBaseUrl, path);
  const headers = new Headers(init?.headers);
  headers.set(
    "Authorization",
    basicAuthHeader(creds.apiKey, creds.outgoingKey)
  );
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function betterPaymentFetchJson<T = unknown>(
  creds: BetterPaymentCredentials,
  path: string,
  init?: RequestInit
): Promise<{ status: number; data: T; raw: string }> {
  const res = await betterPaymentFetch(creds, path, init);
  const raw = await res.text();
  let data: T;
  try {
    data = (raw ? JSON.parse(raw) : null) as T;
  } catch {
    throw new BetterPaymentApiError(
      `Better Payment antwortete nicht mit JSON (HTTP ${res.status}).`,
      res.status,
      raw.slice(0, 4000)
    );
  }
  if (!res.ok) {
    const msg = extractBetterPaymentErrorMessage(data, res.status);
    throw new BetterPaymentApiError(msg, res.status, raw.slice(0, 8000));
  }
  return { status: res.status, data, raw };
}

function extractBetterPaymentErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.error_message === "string" && o.error_message.trim()) {
      const code =
        typeof o.error_code === "number" || typeof o.error_code === "string"
          ? ` (error_code ${o.error_code})`
          : "";
      return `${o.error_message.trim()}${code}`;
    }
    if (typeof o.message === "string" && o.message.trim()) {
      return o.message.trim();
    }
  }
  return `Better Payment HTTP ${status}`;
}

/** Auth-Smoke-Test: Transaktionsliste abrufen (BASIC AUTH). */
export async function betterPaymentProbeAuth(
  creds: BetterPaymentCredentials
): Promise<{ status: number; data: unknown; raw: string }> {
  return betterPaymentFetchJson(creds, "/rest/transactions?per=1");
}

export type BetterPaymentCreatePaymentInput = {
  paymentType: BetterPaymentMethodId;
  amount: number;
  currency: string;
  orderId: string;
  merchantReference?: string;
  successUrl: string;
  errorUrl: string;
  /** Required for Wero */
  weroCheckoutUrl?: string;
  postbackUrl?: string;
  billing: {
    firstName: string;
    lastName: string;
    email?: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
};

export type BetterPaymentCreatePaymentResponse = {
  transaction_id?: string;
  order_id?: string;
  status_code?: number;
  status?: string;
  error_code?: number;
  error_message?: string;
  message?: string;
  client_action?: string;
  action_data?: {
    url?: string;
    fields?: Record<string, string>;
  };
  [key: string]: unknown;
};

export type BetterPaymentTransaction = {
  transaction_id?: string;
  order_id?: string;
  status_code?: number;
  status?: string;
  amount?: number;
  currency?: string;
  payment_type?: string;
  merchant_reference?: string;
  error_code?: number;
  error_message?: string;
  [key: string]: unknown;
};

export async function betterPaymentCreatePayment(
  creds: BetterPaymentCredentials,
  input: BetterPaymentCreatePaymentInput
): Promise<{
  status: number;
  data: BetterPaymentCreatePaymentResponse;
  raw: string;
  requestBody: Record<string, unknown>;
}> {
  const requestBody: Record<string, unknown> = {
    payment_type: input.paymentType,
    amount: input.amount,
    currency: input.currency,
    order_id: input.orderId,
    merchant_reference: input.merchantReference ?? input.orderId,
    success_url: input.successUrl,
    error_url: input.errorUrl,
    first_name: input.billing.firstName,
    last_name: input.billing.lastName,
    address: input.billing.address,
    city: input.billing.city,
    postal_code: input.billing.postalCode,
    country: input.billing.country,
  };

  if (input.billing.email) {
    requestBody.email = input.billing.email;
  }
  // postback_url ist laut API Pflicht und muss https nutzen.
  if (!input.postbackUrl?.trim()) {
    throw new BetterPaymentApiError(
      "postback_url (HTTPS) ist Pflicht für Better Payment.",
      400,
      ""
    );
  }
  requestBody.postback_url = input.postbackUrl.trim();
  if (input.paymentType === "wero") {
    requestBody.wero_checkout_url =
      input.weroCheckoutUrl?.trim() || input.successUrl;
  }

  const result = await betterPaymentFetchJson<BetterPaymentCreatePaymentResponse>(
    creds,
    "/rest/payment",
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    }
  );

  const errorCode = result.data?.error_code;
  if (typeof errorCode === "number" && errorCode !== 0) {
    const msg =
      typeof result.data.error_message === "string" &&
      result.data.error_message.trim()
        ? result.data.error_message.trim()
        : typeof result.data.message === "string" && result.data.message.trim()
          ? result.data.message.trim()
          : `Better Payment error_code ${errorCode}`;
    throw new BetterPaymentApiError(
      `${msg} (error_code ${errorCode})`,
      result.status,
      result.raw.slice(0, 8000)
    );
  }

  return {
    ...result,
    requestBody,
  };
}

export async function betterPaymentGetTransaction(
  creds: BetterPaymentCredentials,
  transactionId: string
): Promise<BetterPaymentTransaction> {
  const id = transactionId.trim();
  if (!id) throw new Error("transactionId fehlt.");
  const { data } = await betterPaymentFetchJson<BetterPaymentTransaction>(
    creds,
    `/rest/transactions/${encodeURIComponent(id)}`
  );
  return data;
}

export async function betterPaymentFindTransactionsByOrderId(
  creds: BetterPaymentCredentials,
  orderId: string
): Promise<BetterPaymentTransaction[]> {
  const oid = orderId.trim();
  if (!oid) throw new Error("orderId fehlt.");
  const q = new URLSearchParams({ order_id: oid });
  const { data } = await betterPaymentFetchJson<unknown>(
    creds,
    `/rest/transactions?${q.toString()}`
  );
  if (Array.isArray(data)) {
    return data as BetterPaymentTransaction[];
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.transactions)) {
      return o.transactions as BetterPaymentTransaction[];
    }
    if (Array.isArray(o.data)) {
      return o.data as BetterPaymentTransaction[];
    }
    // single object response
    if (typeof o.transaction_id === "string" || typeof o.order_id === "string") {
      return [o as BetterPaymentTransaction];
    }
  }
  return [];
}
