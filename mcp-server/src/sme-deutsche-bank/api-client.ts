import { randomUUID } from "node:crypto";
import { getSmeDbAccessToken, SmeDbApiError } from "./oauth.js";
import {
  smeDbGetResolvedCredentials,
  validateSmeDbUserSession,
} from "./resolved-credentials.js";
import type {
  SmeDbAccount,
  SmeDbEndpoints,
  SmeDbTransaction,
} from "./shared.js";

async function readErrorBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 800);
  } catch {
    return "";
  }
}

async function smeDbFetch(
  pathOrUrl: string,
  init?: RequestInit & { accessToken?: string }
): Promise<Response> {
  const creds = smeDbGetResolvedCredentials();
  const err = validateSmeDbUserSession(creds);
  if (err) throw new Error(err);

  const accessToken =
    init?.accessToken ?? (await getSmeDbAccessToken());
  const { accessToken: _a, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(pathOrUrl, {
    ...rest,
    headers,
    signal: rest.signal ?? AbortSignal.timeout(45_000),
  });
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function substIban(template: string, iban: string): string {
  if (template.includes("%1")) {
    return template.replace("%1", encodeURIComponent(iban.replace(/\s/g, "")));
  }
  return template;
}

export function parseSmeDbAccounts(raw: unknown): SmeDbAccount[] {
  const root = asRecord(raw);
  const list = Array.isArray(root?.accounts)
    ? root!.accounts
    : Array.isArray(raw)
      ? raw
      : [];

  return list
    .map((item): SmeDbAccount | null => {
      const o = asRecord(item);
      if (!o) return null;
      const iban = typeof o.iban === "string" ? o.iban.replace(/\s/g, "") : "";
      if (!iban) return null;
      return {
        iban,
        currencyCode:
          typeof o.currencyCode === "string" ? o.currencyCode : null,
        bic: typeof o.bic === "string" ? o.bic : null,
        accountType:
          typeof o.accountType === "string" ? o.accountType : null,
        currentBalance:
          typeof o.currentBalance === "number" ? o.currentBalance : null,
        productDescription:
          typeof o.productDescription === "string"
            ? o.productDescription
            : null,
      };
    })
    .filter((x): x is SmeDbAccount => x !== null);
}

export function parseSmeDbTransactions(raw: unknown): SmeDbTransaction[] {
  const root = asRecord(raw);
  const list = Array.isArray(root?.transactions)
    ? root!.transactions
    : Array.isArray(raw)
      ? raw
      : [];

  return list
    .map((item): SmeDbTransaction | null => {
      const o = asRecord(item);
      if (!o) return null;
      return {
        id: typeof o.id === "string" ? o.id : o.id != null ? String(o.id) : null,
        originIban:
          typeof o.originIban === "string" ? o.originIban : null,
        amount: typeof o.amount === "number" ? o.amount : null,
        counterPartyName:
          typeof o.counterPartyName === "string" ? o.counterPartyName : null,
        counterPartyIban:
          typeof o.counterPartyIban === "string" ? o.counterPartyIban : null,
        bookingDate:
          typeof o.bookingDate === "string" ? o.bookingDate : null,
        valueDate: typeof o.valueDate === "string" ? o.valueDate : null,
        currencyCode:
          typeof o.currencyCode === "string" ? o.currencyCode : null,
        paymentReference:
          typeof o.paymentReference === "string" ? o.paymentReference : null,
        e2eReference:
          typeof o.e2eReference === "string"
            ? o.e2eReference
            : typeof o.endToEndIdentification === "string"
              ? o.endToEndIdentification
              : null,
        mandateReference:
          typeof o.mandateReference === "string" ? o.mandateReference : null,
      };
    })
    .filter((x): x is SmeDbTransaction => x !== null);
}

export async function smeDbFetchAccounts(): Promise<{
  accounts: SmeDbAccount[];
  raw: unknown;
}> {
  const endpoints = smeDbGetResolvedCredentials().endpoints;
  const res = await smeDbFetch(endpoints.cashAccountsUrl);
  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `Konten abrufen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text
    );
  }
  const raw = text ? JSON.parse(text) : {};
  return { accounts: parseSmeDbAccounts(raw), raw };
}

export async function smeDbFetchTransactions(args: {
  iban: string;
  limit?: number;
  bookingDateFrom?: string;
}): Promise<{ transactions: SmeDbTransaction[]; raw: unknown }> {
  const endpoints = smeDbGetResolvedCredentials().endpoints;
  const iban = args.iban.replace(/\s/g, "");
  const q = new URLSearchParams();
  q.set("iban", iban);
  q.set("limit", String(args.limit ?? 200));
  if (args.bookingDateFrom?.trim()) {
    q.set("bookingDateFrom", args.bookingDateFrom.trim());
  }
  const url = `${endpoints.transactionsUrl}?${q.toString()}`;
  const res = await smeDbFetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `Transaktionen abrufen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text
    );
  }
  const raw = text ? JSON.parse(text) : {};
  return { transactions: parseSmeDbTransactions(raw), raw };
}

export async function smeDbCheckInstantReachability(
  creditorIban: string
): Promise<{ reachable: boolean; raw: unknown }> {
  const endpoints = smeDbGetResolvedCredentials().endpoints;
  const url = substIban(
    endpoints.instantCreditStatusUrl,
    creditorIban.replace(/\s/g, "")
  );
  const res = await smeDbFetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `Instant-Erreichbarkeit fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text
    );
  }
  const raw = text ? JSON.parse(text) : {};
  const o = asRecord(raw);
  return {
    reachable: o?.isInstantPaymentReachable === true,
    raw,
  };
}

export async function smeDbListScaMethods(): Promise<{
  methods: Array<{
    method: string;
    status: string | null;
    mobilePhoneNumber: string | null;
  }>;
  raw: unknown;
}> {
  const endpoints = smeDbGetResolvedCredentials().endpoints;
  const res = await smeDbFetch(endpoints.challengeMethodsUrl);
  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `SCA-Methoden abrufen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text
    );
  }
  const raw = text ? JSON.parse(text) : {};
  const root = asRecord(raw);
  const list = Array.isArray(root?.methods) ? root!.methods : [];
  const methods = list
    .map((item) => {
      const o = asRecord(item);
      if (!o || typeof o.method !== "string") return null;
      const meta = asRecord(o.metadata);
      return {
        method: o.method,
        status: typeof o.status === "string" ? o.status : null,
        mobilePhoneNumber:
          typeof meta?.mobilePhoneNumber === "string"
            ? meta.mobilePhoneNumber
            : null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { methods, raw };
}

export async function smeDbStartScaChallenge(args: {
  method: string;
  amount: number;
  currency?: string;
  targetIban: string;
  language?: string;
}): Promise<{
  challengeId: string | null;
  challenge: Record<string, unknown> | null;
  raw: unknown;
}> {
  const endpoints = smeDbGetResolvedCredentials().endpoints;
  const payload = {
    method: args.method,
    requestType: "INSTANT_SEPA_CREDIT_TRANSFERS",
    language: args.language ?? "de",
    requestData: {
      amountCurrency: (args.currency ?? "EUR").toUpperCase(),
      amountValue: args.amount,
      targetIban: args.targetIban.replace(/\s/g, ""),
      type: "challengeRequestDataInstantSepaCreditTransfers",
    },
  };

  const res = await smeDbFetch(endpoints.challengesUrl, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `SCA-Challenge starten fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text
    );
  }
  const raw = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  const challenge =
    raw.challenge && typeof raw.challenge === "object"
      ? (raw.challenge as Record<string, unknown>)
      : null;
  return {
    challengeId: typeof raw.id === "string" ? raw.id : null,
    challenge,
    raw,
  };
}

export async function smeDbCompleteScaChallenge(args: {
  challengeId: string;
  tan: string;
}): Promise<{ challengeProofToken: string | null; raw: unknown }> {
  const endpoints = smeDbGetResolvedCredentials().endpoints;
  const url = `${endpoints.challengesUrl}/${encodeURIComponent(args.challengeId)}`;
  const res = await smeDbFetch(url, {
    method: "PATCH",
    body: JSON.stringify({ challengeResponse: args.tan }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `SCA-Challenge bestätigen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text
    );
  }
  const raw = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  return {
    challengeProofToken:
      typeof raw.challengeProofToken === "string"
        ? raw.challengeProofToken
        : null,
    raw,
  };
}

export type SmeDbInstantPaymentInput = {
  debtorIban: string;
  debtorCurrency?: string;
  creditorName: string;
  creditorIban: string;
  creditorCurrency?: string;
  amount: number;
  currency?: string;
  endToEndIdentification?: string;
  remittanceInformationUnstructured?: string;
  /** SCA proof token, or "PUSHTAN" for push flow */
  otp: string;
  idempotencyId?: string;
};

export async function smeDbInitiateInstantPayment(
  input: SmeDbInstantPaymentInput
): Promise<{
  paymentId: string | null;
  transactionStatus: string | null;
  raw: unknown;
}> {
  const endpoints = smeDbGetResolvedCredentials().endpoints;
  const idempotencyId = input.idempotencyId?.trim() || randomUUID();
  const payload: Record<string, unknown> = {
    debtorAccount: {
      iban: input.debtorIban.replace(/\s/g, ""),
      currencyCode: (input.debtorCurrency ?? "EUR").toUpperCase(),
    },
    endToEndIdentification:
      input.endToEndIdentification?.trim() ||
      randomUUID().replace(/-/g, "").slice(0, 35),
    instructedAmount: {
      amount: input.amount,
      currencyCode: (input.currency ?? "EUR").toUpperCase(),
    },
    creditorName: input.creditorName,
    creditorAccount: {
      iban: input.creditorIban.replace(/\s/g, ""),
      currencyCode: (input.creditorCurrency ?? "EUR").toUpperCase(),
    },
  };
  if (input.remittanceInformationUnstructured?.trim()) {
    payload.remittanceInformationUnstructured =
      input.remittanceInformationUnstructured.trim();
  }

  const res = await smeDbFetch(endpoints.instantCreditTransUrl, {
    method: "POST",
    headers: {
      otp: input.otp,
      "idempotency-id": idempotencyId,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `Instant-Zahlung fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text
    );
  }
  const raw = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  return {
    paymentId: typeof raw.paymentId === "string" ? raw.paymentId : null,
    transactionStatus:
      typeof raw.transactionStatus === "string" ? raw.transactionStatus : null,
    raw,
  };
}

export async function smeDbGetPaymentStatus(paymentId: string): Promise<{
  paymentId: string;
  transactionStatus: string | null;
  raw: unknown;
}> {
  const endpoints = smeDbGetResolvedCredentials().endpoints;
  const url = `${endpoints.instantCreditTransUrl}/${encodeURIComponent(paymentId)}`;
  const res = await smeDbFetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `Zahlungsstatus fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text
    );
  }
  const raw = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  return {
    paymentId,
    transactionStatus:
      typeof raw.transactionStatus === "string" ? raw.transactionStatus : null,
    raw,
  };
}

export async function smeDbFetchCreditCards(): Promise<{
  cards: Array<{
    technicalId: string | null;
    embossedLine1: string | null;
    productName: string | null;
    securePAN: string | null;
    expiryDate: string | null;
  }>;
  raw: unknown;
}> {
  const endpoints: SmeDbEndpoints = smeDbGetResolvedCredentials().endpoints;
  const res = await smeDbFetch(endpoints.creditCardsUrl);
  const text = await res.text();
  if (!res.ok) {
    throw new SmeDbApiError(
      `Kreditkarten abrufen fehlgeschlagen (HTTP ${res.status})`,
      res.status,
      text
    );
  }
  const raw = text ? JSON.parse(text) : {};
  const root = asRecord(raw);
  const list = Array.isArray(root?.items) ? root!.items : [];
  const cards = list
    .map((item) => {
      const o = asRecord(item);
      if (!o) return null;
      return {
        technicalId:
          o.technicalId != null ? String(o.technicalId) : null,
        embossedLine1:
          typeof o.embossedLine1 === "string" ? o.embossedLine1 : null,
        productName:
          typeof o.productName === "string" ? o.productName : null,
        securePAN: typeof o.securePAN === "string" ? o.securePAN : null,
        expiryDate: typeof o.expiryDate === "string" ? o.expiryDate : null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { cards, raw };
}
