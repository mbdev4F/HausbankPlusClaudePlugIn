import { createHash, randomUUID } from "node:crypto";
import { URL } from "node:url";

/** Wie BC: Prefix + CreateGuid ohne { } und -. */
export function createCbConnectCorrelationId(prefix: string): string {
  return prefix + randomUUID().replace(/[{}-]/g, "");
}

/** Account-Balance / Kontenabfragen (BC: ACID + Guid). */
export function createAccountBalanceCorrelationId(): string {
  return createCbConnectCorrelationId("ACID");
}

/** Statement-Request (BC: STMT + Guid ohne { } und -). */
export function createStatementCorrelationId(): string {
  return createCbConnectCorrelationId("STMT");
}

/** Zertifikats-CSR / Renewal (BC: CMSR + Guid ohne { } und -). */
export function createCertificateCorrelationId(): string {
  return createCbConnectCorrelationId("CMSR");
}

/** Account Pre-Validation (BC: PREV + Guid ohne { } und -). */
export function createAccountPreValidationCorrelationId(): string {
  return createCbConnectCorrelationId("PREV");
}

/** FX4Cash HTTP-Header-Präfix (Sandbox/Postman: PYMT + Guid). */
export const FX4CASH_CORRELATION_PREFIX = "PYMT";

/** FX4Cash Zahlungsinitiierung (Sandbox: PYMT + Guid). */
export function createFx4CashCorrelationId(): string {
  return createCbConnectCorrelationId(FX4CASH_CORRELATION_PREFIX);
}

/** Guid für endToEndIdentification (ohne PYMT-Präfix). */
export function createFx4CashPaymentGuid(): string {
  return randomUUID().replace(/[{}-]/g, "").toUpperCase();
}

/** Neues Paar: Body-E2E + Header x-correlation-identifier (PYMT + E2E). */
export function createFx4CashCorrelationPair(): {
  correlationId: string;
  endToEndIdentification: string;
} {
  const endToEndIdentification = createFx4CashPaymentGuid();
  return {
    endToEndIdentification,
    correlationId: FX4CASH_CORRELATION_PREFIX + endToEndIdentification,
  };
}

/**
 * Koppelt E2E (pain.001) und Correlation-Header wie im DB-Referenz-curl:
 * x-correlation-identifier = PYMT + endToEndIdentification.
 */
export function resolveFx4CashCorrelationPair(
  endToEndIdentification?: string | null
): { correlationId: string; endToEndIdentification: string } {
  const raw = endToEndIdentification?.trim();
  if (!raw) {
    return createFx4CashCorrelationPair();
  }

  const normalized = raw.replace(/[{}-\s]/g, "").toUpperCase();
  const bodyE2e = normalized.startsWith(FX4CASH_CORRELATION_PREFIX)
    ? normalized.slice(FX4CASH_CORRELATION_PREFIX.length)
    : normalized;

  return {
    endToEndIdentification: bodyE2e,
    correlationId: FX4CASH_CORRELATION_PREFIX + bodyE2e,
  };
}

/** Wie BC getCurrentUtcTime: 2024-10-02T15:34:32Z */
export function formatCbConnectApiTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-` +
    `${pad(date.getUTCMonth() + 1)}-` +
    `${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}:` +
    `${pad(date.getUTCMinutes())}:` +
    `${pad(date.getUTCSeconds())}Z`
  );
}

const LF = "\n";

/** Wie BC APIHelper.GetCurrentGMTTime — HTTP-date (RFC 7231). */
export function formatCbConnectGmtDate(date = new Date()): string {
  return date.toUTCString();
}

export function buildCbConnectSigningInput(options: {
  url: string;
  method: "GET" | "POST";
  dateHeader: string;
  body?: string;
}): { signingInput: string; digestHeader?: string } {
  const method = options.method.toLowerCase();
  const u = new URL(options.url);
  const requestTarget = `${u.pathname}${u.search}`;

  let signingInput =
    `date: ${options.dateHeader}${LF}` +
    `(request-target): ${method} ${requestTarget}`;

  if (method === "post") {
    const body = options.body ?? "";
    const hash = createHash("sha256").update(body, "utf8").digest("base64");
    const digestHeader = `SHA-256=${hash}`;
    signingInput += `${LF}digest: ${digestHeader}`;
    return { signingInput, digestHeader };
  }

  return { signingInput };
}

export function buildCbConnectSignatureHeader(options: {
  keyId: string;
  method: "GET" | "POST";
  signatureBase64: string;
}): string {
  const keyId = options.keyId.trim() || "undefined";
  let header =
    `keyId="${keyId}",algorithm="rsa-sha256",headers="date (request-target)`;
  if (options.method.toLowerCase() === "post") {
    header += " digest";
  }
  header += `",signature="${options.signatureBase64}"`;
  return header;
}

export function resolveCbConnectSignatureKeyId(
  corporateSealKeyId: string
): string {
  return corporateSealKeyId.trim() || "undefined";
}

/** BC-URL mit %1 / %2 / %3 für branchIdentifier, accountCurrency, accountIdentifier. */
export function applyAccountBalanceUrlPlaceholders(
  template: string,
  branchIdentifier: string,
  accountCurrency: string,
  accountIdentifier: string
): string {
  const enc = (v: string) => encodeURIComponent(v);
  return template
    .replace(/%1/g, enc(branchIdentifier))
    .replace(/%2/g, enc(accountCurrency))
    .replace(/%3/g, enc(accountIdentifier));
}

export function formatProbeResponseJson(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body) as unknown, null, 2);
  } catch {
    return body;
  }
}

/** Request-Header für Probe-UI (Bearer gekürzt). */
export function formatProbeRequestHeaders(
  headers: Record<string, string>
): string {
  const masked: Record<string, string> = {};
  for (const key of Object.keys(headers).sort()) {
    const value = headers[key] ?? "";
    if (key.toLowerCase() === "authorization" && value.startsWith("Bearer ")) {
      const token = value.slice(7);
      masked[key] = `Bearer ${token.slice(0, 8)}${token.length > 8 ? "…" : ""}`;
    } else {
      masked[key] = value;
    }
  }
  return JSON.stringify(masked, null, 2);
}

export function parseCbConnectHealthStatus(body: string): string | null {
  try {
    const json = JSON.parse(body) as { status?: string };
    return typeof json.status === "string" ? json.status : null;
  } catch {
    return null;
  }
}
