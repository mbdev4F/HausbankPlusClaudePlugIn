import type { CbConnectAccountPreValidationInput } from "./cb-connect-account-prevalidation-shared.js";

export type CbConnectAccountPreValidationParsedResult = {
  resultSummary: string;
  resultCode: string | null;
  matchScore: string | null;
  fraudIndicator: string | null;
};

function normalizeAccount(value: string): {
  iban: string;
  accountNumber: string;
  bankCode: string;
} {
  const raw = value.replace(/\s/g, "").toUpperCase();
  if (/^[A-Z]{2}\d{2}/.test(raw)) {
    return { iban: raw, accountNumber: "", bankCode: "" };
  }
  return {
    iban: "",
    accountNumber: raw.replace(/\D/g, ""),
    bankCode: "",
  };
}

/** Request-Body für CB-Connect Account Pre-Validation (BC-kompatibles Schema). */
export function buildCbConnectAccountPreValidationBody(
  input: CbConnectAccountPreValidationInput
): string {
  const name = input.beneficiaryName.trim();
  const accountRaw = input.accountNumber.trim();
  const bankCode = (input.bankCode ?? "").replace(/\s/g, "").toUpperCase();
  const acct = normalizeAccount(accountRaw);

  const account: Record<string, string> = {};
  if (acct.iban) {
    account.iban = acct.iban;
  } else {
    if (acct.accountNumber) account.accountNumber = acct.accountNumber;
    if (bankCode) {
      if (bankCode.length <= 8 && /^\d+$/.test(bankCode)) {
        account.bankCode = bankCode;
      } else {
        account.bic = bankCode;
      }
    }
  }

  const payload = {
    accountPreValidationRequest: {
      beneficiary: {
        name,
        account,
      },
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

function deepFind(
  node: unknown,
  keys: string[],
  depth = 0
): string | null {
  if (depth > 8) return null;
  const direct = pickString(node, keys);
  if (direct) return direct;

  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = deepFind(item, keys, depth + 1);
      if (found) return found;
    }
    return null;
  }

  for (const value of Object.values(node as Record<string, unknown>)) {
    const found = deepFind(value, keys, depth + 1);
    if (found) return found;
  }
  return null;
}

/** Antwort der Bank — flexibles Parsing (Sandbox/Prod können leicht abweichen). */
export function parseCbConnectAccountPreValidationResponse(
  body: string
): CbConnectAccountPreValidationParsedResult {
  const trimmed = body.trim();
  if (!trimmed) {
    return {
      resultSummary: "Leere Antwort",
      resultCode: null,
      matchScore: null,
      fraudIndicator: null,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(trimmed) as unknown;
  } catch {
    return {
      resultSummary: trimmed.slice(0, 240),
      resultCode: null,
      matchScore: null,
      fraudIndicator: null,
    };
  }

  const resultCode =
    deepFind(json, [
      "resultCode",
      "validationResultCode",
      "validationStatus",
      "status",
      "matchCode",
      "code",
    ]) ?? null;

  const matchScore =
    deepFind(json, [
      "matchScore",
      "score",
      "confidenceScore",
      "matchProbability",
    ]) ?? null;

  const fraudIndicator =
    deepFind(json, [
      "fraudIndicator",
      "fraudRisk",
      "riskIndicator",
      "riskLevel",
    ]) ?? null;

  const message =
    deepFind(json, [
      "resultMessage",
      "message",
      "description",
      "reason",
      "validationMessage",
    ]) ?? null;

  const summaryParts = [
    resultCode ? `Code: ${resultCode}` : null,
    message,
    matchScore ? `Score: ${matchScore}` : null,
    fraudIndicator ? `Fraud: ${fraudIndicator}` : null,
  ].filter(Boolean);

  return {
    resultSummary:
      summaryParts.length > 0
        ? summaryParts.join(" · ")
        : "Prüfung abgeschlossen",
    resultCode,
    matchScore,
    fraudIndicator,
  };
}
