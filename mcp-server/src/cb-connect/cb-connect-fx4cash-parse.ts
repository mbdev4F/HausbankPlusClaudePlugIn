/** Extrahiert bekannte Felder aus FX4Cash JSON-Antworten (Initiierung / Status-Report). */

function deepFindString(
  node: unknown,
  keys: string[],
  depth = 0
): string | undefined {
  if (depth > 12 || node == null) return undefined;
  if (typeof node === "object" && !Array.isArray(node)) {
    const rec = node as Record<string, unknown>;
    for (const key of keys) {
      const v = rec[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    for (const v of Object.values(rec)) {
      const found = deepFindString(v, keys, depth + 1);
      if (found) return found;
    }
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = deepFindString(item, keys, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

export type Fx4CashInitiationParsed = {
  serviceRequestId?: string;
  endToEndIdentification?: string;
  messageIdentification?: string;
};

export function parseFx4CashInitiationResponse(
  body: string
): Fx4CashInitiationParsed {
  try {
    const json = JSON.parse(body) as unknown;
    return {
      serviceRequestId: deepFindString(json, [
        "serviceRequestId",
        "service-request-identifier",
        "serviceRequestIdentifier",
        "service-request-id",
      ]),
      endToEndIdentification: deepFindString(json, [
        "endToEndIdentification",
        "endToEndId",
      ]),
      messageIdentification: deepFindString(json, [
        "messageIdentification",
        "messageId",
      ]),
    };
  } catch {
    return {};
  }
}

export type Fx4CashStatusReportInput = {
  debtorIban: string;
  endToEndIdentification: string;
};

export function buildFx4CashStatusReportBody(
  input: Fx4CashStatusReportInput
): { debtorAccount: { iban: string }; endToEndIdentification: string } {
  return {
    debtorAccount: {
      iban: input.debtorIban.replace(/\s/g, "").toUpperCase(),
    },
    endToEndIdentification: input.endToEndIdentification.trim(),
  };
}

export function formatFx4CashStatusReportJson(
  input: Fx4CashStatusReportInput
): string {
  return JSON.stringify(buildFx4CashStatusReportBody(input), null, 2);
}

export type Fx4CashStatusReportParsed = {
  transactionStatus?: string;
  serviceRequestId?: string;
  endToEndIdentification?: string;
  summary?: string;
};

export function parseFx4CashStatusReportResponse(
  body: string
): Fx4CashStatusReportParsed {
  try {
    const json = JSON.parse(body) as unknown;
    const transactionStatus = deepFindString(json, [
      "transactionStatus",
      "paymentStatus",
      "status",
      "transactionIndividualStatus",
    ]);
    const serviceRequestId = deepFindString(json, [
      "serviceRequestId",
      "service-request-identifier",
      "serviceRequestIdentifier",
    ]);
    const endToEndIdentification = deepFindString(json, [
      "endToEndIdentification",
      "endToEndId",
    ]);

    const parts = [
      transactionStatus ? `Status: ${transactionStatus}` : null,
      serviceRequestId ? `Service-ID: ${serviceRequestId}` : null,
      endToEndIdentification ? `E2E: ${endToEndIdentification}` : null,
    ].filter(Boolean);

    return {
      transactionStatus,
      serviceRequestId,
      endToEndIdentification,
      summary: parts.length > 0 ? parts.join(" · ") : undefined,
    };
  } catch {
    return {};
  }
}
