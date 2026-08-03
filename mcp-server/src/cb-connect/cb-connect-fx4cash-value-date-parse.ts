/** Parst FX4Cash valueDate (Evaluate) Antworten für Sandbox-Szenarien. */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function deepFindBoolean(
  node: unknown,
  keys: string[],
  depth = 0
): boolean | undefined {
  if (depth > 10 || node == null) return undefined;
  if (typeof node === "boolean") return node;
  if (typeof node === "object" && !Array.isArray(node)) {
    const rec = node as Record<string, unknown>;
    for (const key of keys) {
      const v = rec[key];
      if (typeof v === "boolean") return v;
      if (v === "true") return true;
      if (v === "false") return false;
    }
    for (const v of Object.values(rec)) {
      const found = deepFindBoolean(v, keys, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

const ACCEPTED_KEYS = [
  "valueDateAccepted",
  "accepted",
  "isAccepted",
  "valid",
  "valueDateValid",
  "suggestedValueDateAccepted",
];

const CREDIT_DATE_KEYS = [
  "creditValueDate",
  "valueDate",
  "accountValueDate",
  "creditDate",
  "earliestCreditDate",
  "settlementDate",
  "confirmedValueDate",
  "suggestedValueDate",
];

function deepFindIsoDate(
  node: unknown,
  keys: string[],
  depth = 0
): string | undefined {
  if (depth > 10 || node == null) return undefined;
  if (typeof node === "string" && ISO_DATE.test(node.trim())) {
    return node.trim();
  }
  if (typeof node === "object" && !Array.isArray(node)) {
    const rec = node as Record<string, unknown>;
    for (const key of keys) {
      const v = rec[key];
      if (typeof v === "string" && ISO_DATE.test(v.trim())) return v.trim();
    }
    for (const v of Object.values(rec)) {
      const found = deepFindIsoDate(v, keys, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

export type Fx4CashValueDateParseResult = {
  accepted?: boolean;
  creditDate?: string;
};

/** `true` = Valuta akzeptiert, `false` = abgelehnt, `undefined` = nicht erkennbar. */
export function parseFx4CashValueDateAccepted(body: string): boolean | undefined {
  return parseFx4CashValueDateResponse(body).accepted;
}

export function parseFx4CashValueDateResponse(
  body: string
): Fx4CashValueDateParseResult {
  const trimmed = body.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return {
      accepted: deepFindBoolean(parsed, ACCEPTED_KEYS),
      creditDate: deepFindIsoDate(parsed, CREDIT_DATE_KEYS),
    };
  } catch {
    const accepted = /\"false\"|:\s*false\b/i.test(trimmed)
      ? false
      : /\"true\"|:\s*true\b/i.test(trimmed)
        ? true
        : undefined;
    const dateMatch = trimmed.match(/"(\d{4}-\d{2}-\d{2})"/);
    return {
      accepted,
      creditDate: dateMatch?.[1],
    };
  }
}
