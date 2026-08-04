import type {
  FinapiCreateUserResponse,
  FinapiEndpoints,
  FinapiTokenResponse,
  FinapiWebFormResponse,
} from "./shared.js";

export class FinapiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string
  ) {
    super(message);
    this.name = "FinapiApiError";
  }

  detailMessage(): string {
    try {
      const parsed = JSON.parse(this.body) as {
        errors?: Array<{ field?: string; message?: string }>;
        description?: string;
        code?: string;
      };
      if (parsed.errors?.length) {
        return parsed.errors
          .map((e) => [e.field, e.message].filter(Boolean).join(": "))
          .join("; ");
      }
      if (parsed.description) return parsed.description;
      if (parsed.code) return parsed.code;
    } catch {
      /* ignore */
    }
    return this.body.trim().slice(0, 240);
  }
}

/** finAPI 422 when redirectUrl/callbacks require a licensed mandator (common in sandbox). */
export function finapiIsRedirectUrlLicenseError(e: unknown): boolean {
  if (!(e instanceof FinapiApiError) || e.status !== 422) return false;
  const haystack = `${e.detailMessage()} ${e.body}`.toLowerCase();
  return (
    haystack.includes("redirecturl") &&
    (haystack.includes("unlicensed") || haystack.includes("not allowed"))
  );
}

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

async function readErrorBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}

export async function finapiGetClientToken(
  endpoints: FinapiEndpoints,
  clientId: string,
  clientSecret: string
): Promise<FinapiTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${endpoints.accessBaseUrl}/api/v2/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI Client-Token fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as FinapiTokenResponse;
}

export async function finapiGetUserToken(
  endpoints: FinapiEndpoints,
  clientId: string,
  clientSecret: string,
  username: string,
  password: string
): Promise<FinapiTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
  });

  const res = await fetch(`${endpoints.accessBaseUrl}/api/v2/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI User-Token fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as FinapiTokenResponse;
}

export async function finapiCreateUser(
  endpoints: FinapiEndpoints,
  clientToken: string,
  userId?: string
): Promise<FinapiCreateUserResponse> {
  const res = await fetch(`${endpoints.accessBaseUrl}/api/v2/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(userId ? { id: userId } : {}),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI User anlegen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as FinapiCreateUserResponse;
}

export async function finapiCreateBankConnectionWebForm(
  endpoints: FinapiEndpoints,
  userToken: string,
  params: {
    callbackUrl?: string;
    accountTypes?: readonly string[];
  }
): Promise<FinapiWebFormResponse> {
  const payload: Record<string, unknown> = {
    accountTypes: params.accountTypes ?? ["CHECKING", "SAVINGS"],
  };

  // Web Form 2.0: nur callbacks.finalised (kein "aborted"); URL muss HTTPS sein.
  const callbackUrl = params.callbackUrl?.trim();
  if (callbackUrl && isHttpsUrl(callbackUrl)) {
    payload.callbacks = { finalised: callbackUrl };
  }

  const res = await fetch(
    `${endpoints.webFormBaseUrl}/api/webForms/bankConnectionImport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new FinapiApiError(
      `finAPI Web Form fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      body
    );
  }

  return (await res.json()) as FinapiWebFormResponse;
}

export async function finapiGetWebForm(
  endpoints: FinapiEndpoints,
  userToken: string,
  webFormId: string
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `${endpoints.webFormBaseUrl}/api/webForms/${encodeURIComponent(webFormId)}`,
    {
      headers: {
        Authorization: `Bearer ${userToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI Web-Form-Status fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function finapiFetchAccounts(
  endpoints: FinapiEndpoints,
  userToken: string,
  options?: { bankConnectionIds?: number[] }
): Promise<unknown> {
  const q = new URLSearchParams();
  const connectionIds = (options?.bankConnectionIds ?? []).filter(
    (id) => Number.isFinite(id)
  );
  if (connectionIds.length > 0) {
    q.set("bankConnectionIds", connectionIds.join(","));
  }
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const res = await fetch(`${endpoints.accessBaseUrl}/api/v2/accounts${suffix}`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI Konten abrufen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return res.json();
}

export async function finapiFetchBankConnections(
  endpoints: FinapiEndpoints,
  userToken: string
): Promise<unknown> {
  const res = await fetch(`${endpoints.accessBaseUrl}/api/v2/bankConnections`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI Bankverbindungen abrufen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return res.json();
}

export async function finapiDeleteAuthorizedUser(
  endpoints: FinapiEndpoints,
  userToken: string
): Promise<void> {
  const res = await fetch(`${endpoints.accessBaseUrl}/api/v2/users`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${userToken}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok && res.status !== 404) {
    throw new FinapiApiError(
      `finAPI User löschen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }
}

export type FinapiStandalonePaymentParams = {
  orders: Array<{
    recipient: { name: string; iban: string; bic?: string };
    amount: { value: number; currency: string };
    purpose: string;
    endToEndId?: string;
    sepaPurposeCode?: string;
  }>;
  executionDate?: string;
  instantPayment?: boolean;
  redirectUrl?: string;
  callbackUrl?: string;
  /** Kein sender — Zahler wählt Konto in der Web Form. */
  sender?: { iban: string };
};

export async function finapiCreateStandalonePaymentWebForm(
  endpoints: FinapiEndpoints,
  userToken: string,
  params: FinapiStandalonePaymentParams
): Promise<FinapiWebFormResponse> {
  const payload: Record<string, unknown> = {
    orders: params.orders.map((o) => ({
      recipient: {
        name: o.recipient.name,
        iban: o.recipient.iban.replace(/\s/g, ""),
        ...(o.recipient.bic?.trim()
          ? { bic: o.recipient.bic.trim() }
          : {}),
      },
      amount: {
        value: o.amount.value,
        currency: o.amount.currency,
      },
      purpose: o.purpose,
      ...(o.endToEndId ? { endToEndId: o.endToEndId } : {}),
      sepaPurposeCode: o.sepaPurposeCode ?? "OTHR",
    })),
    instantPayment: params.instantPayment ?? false,
    allowTestBank: true,
  };

  if (params.executionDate && params.instantPayment !== true) {
    payload.executionDate = params.executionDate;
  }
  if (params.sender?.iban?.trim()) {
    payload.sender = { iban: params.sender.iban.replace(/\s/g, "") };
  }
  if (params.redirectUrl && isHttpsUrl(params.redirectUrl)) {
    payload.redirectUrl = params.redirectUrl;
  }
  if (params.callbackUrl && isHttpsUrl(params.callbackUrl)) {
    payload.callbacks = { finalised: params.callbackUrl };
  }

  const res = await fetch(
    `${endpoints.webFormBaseUrl}/api/webForms/standalonePayment`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI Standalone Payment fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as FinapiWebFormResponse;
}

export type FinapiPaymentResource = {
  id: number;
  status?: string;
  statusV2?: string;
  accountId?: number;
  /** Sender-IBAN bei Standalone Payment (nach Web-Form-Abschluss). */
  iban?: string;
  bankMessage?: string;
};

export type FinapiMoneyTransferOrderParams = {
  counterpartName: string;
  counterpartIban: string;
  counterpartBic?: string;
  amount: number;
  currency: string;
  purpose?: string;
  sepaPurposeCode?: string;
  endToEndId?: string;
};

export type FinapiCreateMoneyTransferParams = {
  accountId: number;
  moneyTransfers: FinapiMoneyTransferOrderParams[];
  executionDate?: string;
  instantPayment?: boolean;
  singleBooking?: boolean;
};

export type FinapiSubmitPaymentParams = {
  paymentId: number;
  bankingInterface?: "XS2A" | "FINTS_SERVER" | "WEB_SCRAPER";
  redirectUrl?: string;
  forceWebForm?: boolean;
  multiStepAuthentication?: Record<string, unknown>;
};

export type FinapiPsuHeaders = {
  ipAddress?: string;
  deviceOs?: string;
  userAgent?: string;
};

function finapiUserHeaders(
  userToken: string,
  psu?: FinapiPsuHeaders
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (psu?.ipAddress?.trim()) {
    headers["PSU-IP-Address"] = psu.ipAddress.trim();
  }
  if (psu?.deviceOs?.trim()) {
    headers["PSU-Device-OS"] = psu.deviceOs.trim();
  }
  if (psu?.userAgent?.trim()) {
    headers["PSU-User-Agent"] = psu.userAgent.trim();
  }
  return headers;
}

function parseFinapiPayment(json: unknown): FinapiPaymentResource {
  const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const id = typeof o.id === "number" ? o.id : Number(o.id);
  const ibanRaw = typeof o.iban === "string" ? o.iban.trim() : "";
  return {
    id,
    status: typeof o.status === "string" ? o.status : undefined,
    statusV2: typeof o.statusV2 === "string" ? o.statusV2 : undefined,
    accountId: typeof o.accountId === "number" ? o.accountId : undefined,
    iban: ibanRaw ? ibanRaw.replace(/\s/g, "") : undefined,
    bankMessage: typeof o.bankMessage === "string" ? o.bankMessage : undefined,
  };
}

export function finapiParseErrorPayload(body: string): {
  code?: string;
  message?: string;
  multiStepAuthentication?: Record<string, unknown>;
} {
  try {
    const parsed = JSON.parse(body) as {
      errors?: Array<{
        code?: string;
        message?: string;
        multiStepAuthentication?: Record<string, unknown>;
      }>;
    };
    const first = parsed.errors?.[0];
    if (!first) return {};
    return {
      code: first.code,
      message: first.message,
      multiStepAuthentication: first.multiStepAuthentication,
    };
  } catch {
    return {};
  }
}

export async function finapiCreateMoneyTransfer(
  endpoints: FinapiEndpoints,
  userToken: string,
  params: FinapiCreateMoneyTransferParams,
  requestId?: string
): Promise<FinapiPaymentResource> {
  const payload: Record<string, unknown> = {
    accountId: params.accountId,
    instantPayment: params.instantPayment ?? false,
    singleBooking: params.singleBooking ?? true,
    moneyTransfers: params.moneyTransfers.map((o) => ({
      counterpartName: o.counterpartName,
      counterpartIban: o.counterpartIban.replace(/\s/g, ""),
      ...(o.counterpartBic?.trim()
        ? { counterpartBic: o.counterpartBic.replace(/\s/g, "").toUpperCase() }
        : {}),
      amount: o.amount,
      currency: o.currency,
      purpose: o.purpose,
      sepaPurposeCode: o.sepaPurposeCode ?? "OTHR",
      ...(o.endToEndId ? { endToEndId: o.endToEndId } : {}),
    })),
  };
  if (params.executionDate) {
    payload.executionDate = params.executionDate;
  }

  const headers = finapiUserHeaders(userToken);
  if (requestId?.trim()) {
    headers["X-Request-Id"] = requestId.trim().slice(0, 255);
  }

  const res = await fetch(
    `${endpoints.accessBaseUrl}/api/v2/payments/moneyTransfers`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    }
  );

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI Zahlung anlegen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return parseFinapiPayment(await res.json());
}

export type FinapiSubmitPaymentResult = {
  payment: FinapiPaymentResource;
  webFormUrl?: string;
  webFormId?: string;
};

function finapiWebFormIdFromUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    const pathname = new URL(url.trim()).pathname;
    const wfMatch = pathname.match(/\/wf\/([^/]+)/i);
    if (wfMatch?.[1]) return wfMatch[1];
    const legacyMatch = pathname.match(/\/webForm\/([^/]+)/i);
    if (legacyMatch?.[1]) return legacyMatch[1];
  } catch {
    /* ignore */
  }
  return undefined;
}

function finapiWebFormUrlFromPayload(json: unknown): string | undefined {
  const o =
    json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  for (const key of ["webFormUrl", "webFormLink", "url", "link"]) {
    const value = o[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  const webForm = o.webForm;
  if (webForm && typeof webForm === "object") {
    const wf = webForm as Record<string, unknown>;
    if (typeof wf.url === "string" && wf.url.trim()) return wf.url.trim();
  }
  return undefined;
}

function buildFinapiSubmitPaymentPayload(
  params: FinapiSubmitPaymentParams
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    paymentId: params.paymentId,
    bankingInterface: params.bankingInterface ?? "XS2A",
  };
  if (params.redirectUrl?.trim()) {
    payload.redirectUrl = params.redirectUrl.trim();
  }
  if (params.forceWebForm === true) {
    payload.forceWebForm = true;
  }
  if (params.multiStepAuthentication) {
    payload.multiStepAuthentication = params.multiStepAuthentication;
  }
  return payload;
}

/**
 * Access API: Zahlung einreichen — liefert ggf. Web-Form-URL für PSU-Freigabe
 * (WEB_FORM_REQUIRED / forceWebForm), statt Web Form „paymentWithAccountId“.
 */
export async function finapiSubmitPaymentForAuthorization(
  endpoints: FinapiEndpoints,
  userToken: string,
  params: FinapiSubmitPaymentParams,
  psu?: FinapiPsuHeaders,
  requestId?: string
): Promise<FinapiSubmitPaymentResult> {
  const headers = finapiUserHeaders(userToken, psu);
  if (requestId?.trim()) {
    headers["X-Request-Id"] = requestId.trim().slice(0, 255);
  }

  const res = await fetch(`${endpoints.accessBaseUrl}/api/v2/payments/submit`, {
    method: "POST",
    headers,
    body: JSON.stringify(buildFinapiSubmitPaymentPayload(params)),
    signal: AbortSignal.timeout(60_000),
  });

  const bodyText = await readErrorBody(res);
  const location =
    res.headers.get("location")?.trim() ||
    res.headers.get("Location")?.trim();

  if (!res.ok) {
    const parsed = finapiParseErrorPayload(bodyText);
    if (parsed.code === "WEB_FORM_REQUIRED" || res.status === 451) {
      let webFormUrl = location;
      if (!webFormUrl && bodyText.trim()) {
        try {
          webFormUrl = finapiWebFormUrlFromPayload(JSON.parse(bodyText));
        } catch {
          /* ignore */
        }
      }
      return {
        payment: { id: params.paymentId },
        webFormUrl,
        webFormId: finapiWebFormIdFromUrl(webFormUrl),
      };
    }
    throw new FinapiApiError(
      `finAPI Zahlung einreichen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      bodyText
    );
  }

  let json: unknown = {};
  if (bodyText.trim()) {
    try {
      json = JSON.parse(bodyText);
    } catch {
      json = {};
    }
  }

  const webFormUrl = finapiWebFormUrlFromPayload(json) || location;
  return {
    payment: parseFinapiPayment(json),
    webFormUrl,
    webFormId: finapiWebFormIdFromUrl(webFormUrl),
  };
}

export async function finapiSubmitPayment(
  endpoints: FinapiEndpoints,
  userToken: string,
  params: FinapiSubmitPaymentParams,
  psu?: FinapiPsuHeaders,
  requestId?: string
): Promise<FinapiPaymentResource> {
  const result = await finapiSubmitPaymentForAuthorization(
    endpoints,
    userToken,
    params,
    psu,
    requestId
  );
  return result.payment;
}

export async function finapiCreateAndSubmitMoneyTransfer(
  endpoints: FinapiEndpoints,
  userToken: string,
  params: FinapiCreateMoneyTransferParams & { redirectUrl?: string },
  requestId?: string
): Promise<FinapiSubmitPaymentResult & { paymentId: number }> {
  const created = await finapiCreateMoneyTransfer(
    endpoints,
    userToken,
    params,
    requestId
  );
  const submitted = await finapiSubmitPaymentForAuthorization(
    endpoints,
    userToken,
    {
      paymentId: created.id,
      redirectUrl: params.redirectUrl,
      forceWebForm: true,
      bankingInterface: "XS2A",
    },
    undefined,
    requestId
  );
  return {
    paymentId: created.id,
    payment: submitted.payment.id ? submitted.payment : created,
    webFormUrl: submitted.webFormUrl,
    webFormId: submitted.webFormId,
  };
}

export type FinapiPaymentWithAccountWebFormParams = {
  /** finAPI Access API — Konto muss zuvor per bankConnectionImport importiert sein. */
  accountId: number;
  /** Optional — AML; sonst ermittelt finAPI aus Kontodaten oder Web Form. */
  senderName?: string;
  orders: Array<{
    recipient: { name: string; iban: string; bic?: string };
    amount: { value: number; currency: string };
    purpose: string;
    endToEndId?: string;
    sepaPurposeCode?: string;
  }>;
  executionDate?: string;
  instantPayment?: boolean;
  redirectUrl?: string;
  callbackUrl?: string;
  verifyPayees?: boolean;
};

export async function finapiCreatePaymentWithAccountWebForm(
  endpoints: FinapiEndpoints,
  userToken: string,
  params: FinapiPaymentWithAccountWebFormParams,
  requestId?: string
): Promise<FinapiWebFormResponse> {
  const sender: Record<string, unknown> = { accountId: params.accountId };
  if (params.senderName?.trim()) {
    sender.name = params.senderName.trim().slice(0, 130);
  }

  const payload: Record<string, unknown> = {
    sender,
    instantPayment: params.instantPayment ?? false,
    orders: params.orders.map((o) => ({
      recipient: {
        name: o.recipient.name,
        iban: o.recipient.iban.replace(/\s/g, ""),
        ...(o.recipient.bic?.trim()
          ? { bic: o.recipient.bic.trim() }
          : {}),
      },
      amount: {
        value: o.amount.value,
        currency: o.amount.currency,
      },
      purpose: o.purpose,
      ...(o.endToEndId ? { endToEndId: o.endToEndId } : {}),
      sepaPurposeCode: o.sepaPurposeCode ?? "OTHR",
    })),
  };

  if (params.executionDate && params.instantPayment !== true) {
    payload.executionDate = params.executionDate;
  }
  if (params.redirectUrl && isHttpsUrl(params.redirectUrl)) {
    payload.redirectUrl = params.redirectUrl;
  }
  if (params.callbackUrl && isHttpsUrl(params.callbackUrl)) {
    payload.callbacks = { finalised: params.callbackUrl };
  }
  if (params.verifyPayees === true || params.verifyPayees === false) {
    payload.verifyPayees = params.verifyPayees;
  }

  const headers = finapiUserHeaders(userToken);
  if (requestId?.trim()) {
    headers["X-Request-Id"] = requestId.trim().slice(0, 255);
  }

  const res = await fetch(
    `${endpoints.webFormBaseUrl}/api/webForms/paymentWithAccountId`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    }
  );

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI Payment Web Form fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as FinapiWebFormResponse;
}

export async function finapiGetPayments(
  endpoints: FinapiEndpoints,
  userToken: string,
  paymentIds: number[]
): Promise<FinapiPaymentResource[]> {
  if (paymentIds.length === 0) return [];
  const q = new URLSearchParams();
  q.set("ids", paymentIds.join(","));
  const res = await fetch(
    `${endpoints.accessBaseUrl}/api/v2/payments?${q.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${userToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI Zahlungsstatus fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  const json = (await res.json()) as { payments?: unknown[] };
  return (json.payments ?? []).map((row) => parseFinapiPayment(row));
}

export async function finapiFetchAccountTransactions(
  endpoints: FinapiEndpoints,
  userToken: string,
  accountId: number,
  params: { page?: number; perPage?: number } = {}
): Promise<unknown> {
  const q = new URLSearchParams();
  if (params.page != null && params.page > 0) {
    q.set("page", String(params.page));
  }
  q.set("perPage", String(params.perPage ?? 250));
  q.set("order", "bankBookingDate,desc");
  q.set("view", "bankView");

  const res = await fetch(
    `${endpoints.accessBaseUrl}/api/v2/transactions?accountIds=${encodeURIComponent(String(accountId))}&${q.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${userToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(45_000),
    }
  );

  if (!res.ok) {
    throw new FinapiApiError(
      `finAPI Transaktionen abrufen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      await readErrorBody(res)
    );
  }

  return res.json();
}
