import type { CheckStatus } from "./sepa-payment-types.js";

/** Wie BC GetVOPRequestJson — Deutsche Bank SEPA Instant VoP. */
export type CbConnectVopInput = {
  payeeName: string;
  payeeIban: string;
  debtorIban: string;
};

export type CbConnectVopParsedResult = {
  voPId: string | null;
  voPMatchCode: string | null;
  resultSummary: string;
  checkStatus: CheckStatus;
  additionalInfo: string | null;
};

function normalizeIban(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

/**
 * Request-Body wie BC Cash365 / Deutsche Bank SEPA Instant VoP:
 * { payee, payeeAccount, debtor: { debtorAccount } }
 */
export function buildCbConnectVopRequestBody(input: CbConnectVopInput): string {
  const payload = {
    payee: { name: input.payeeName.trim() },
    payeeAccount: { iban: normalizeIban(input.payeeIban) },
    debtor: {
      debtorAccount: { iban: normalizeIban(input.debtorIban) },
    },
  };
  return JSON.stringify(payload);
}

function pickString(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const v = record[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

/** Wie BC DetermineVOPMatchCode / MapVOPMatchCode. */
export function determineCbConnectVopMatchCode(
  response: Record<string, unknown>
): string | null {
  const matchStatus = pickString(response, ["matchStatus"]);
  if (matchStatus) return matchStatus.toUpperCase();

  const payeeNameMatch = (pickString(response, ["payeeNameMatch"]) ?? "").toUpperCase();
  const payeeAccountMatch = (
    pickString(response, ["payeeAccountMatch"]) ?? ""
  ).toUpperCase();

  if (payeeNameMatch === "MTCH" && (payeeAccountMatch === "MTCH" || !payeeAccountMatch)) {
    return "MTCH";
  }
  if (payeeNameMatch === "NOAP" || payeeAccountMatch === "NOAP") {
    return "NOAP";
  }
  if (payeeNameMatch === "CMTC" || payeeAccountMatch === "CMTC") {
    return "CMTC";
  }
  if (payeeNameMatch === "NMTC" || payeeAccountMatch === "NMTC") {
    return "NMTC";
  }

  return payeeNameMatch || payeeAccountMatch || null;
}

export function mapCbConnectVoPMatchCodeToStatus(code: string | null): CheckStatus {
  const c = (code ?? "").trim().toUpperCase();
  if (!c) return "pending";
  switch (c) {
    case "MTCH":
      return "ok";
    case "CMTC":
      return "pending";
    case "NMTC":
    case "NOAP":
      return "alert";
    default:
      if (/MTCH|EXACT|MATCH|FULL|OK|PASS|CONFIRM/.test(c)) return "ok";
      if (/NMTC|NOAP|NO.?MATCH|NOT.?MATCH|FAIL|REJECT|INVALID/.test(c)) {
        return "alert";
      }
      if (/CMTC|CLOSE|PARTIAL|WARN|POSSIBLE/.test(c)) return "pending";
      return "pending";
  }
}

export function parseCbConnectVopResponse(body: string): CbConnectVopParsedResult {
  const trimmed = body.trim();
  if (!trimmed) {
    return {
      voPId: null,
      voPMatchCode: null,
      resultSummary: "Leere Antwort",
      checkStatus: "alert",
      additionalInfo: null,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(trimmed) as unknown;
  } catch {
    return {
      voPId: null,
      voPMatchCode: null,
      resultSummary: trimmed.slice(0, 240),
      checkStatus: "alert",
      additionalInfo: null,
    };
  }

  const root =
    json && typeof json === "object"
      ? (json as Record<string, unknown>)
      : {};

  const voPMatchCode = determineCbConnectVopMatchCode(root);
  const additionalInfo = pickString(root, ["additionalInfo"]);
  const checkStatus = mapCbConnectVoPMatchCodeToStatus(voPMatchCode);

  const summaryParts = [
    voPMatchCode ? `Code: ${voPMatchCode}` : null,
    additionalInfo,
  ].filter(Boolean);

  return {
    voPId: null,
    voPMatchCode,
    resultSummary:
      summaryParts.length > 0
        ? summaryParts.join(" · ")
        : checkStatus === "ok"
          ? "VoP erfolgreich"
          : "VoP abgeschlossen",
    checkStatus,
    additionalInfo,
  };
}
