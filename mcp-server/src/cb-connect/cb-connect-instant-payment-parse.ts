import type { CbConnectSepaPaymentStatus } from "./cb-connect-payments-shared.js";

function deepFindString(
  node: unknown,
  keys: string[],
  depth = 0
): string | undefined {
  if (depth > 14 || node == null) return undefined;
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

export type CbConnectInstantPaymentParsed = {
  serviceRequestId?: string;
  serviceRequestDateTime?: string;
  paymentReferencePaymentId?: string;
  paymentReferenceStatus?: string;
  paymentRefReasonCode?: string;
  transactionStatus?: string;
  endToEndIdentification?: string;
  summary?: string;
};

export function parseCbConnectInstantPaymentResponse(
  body: string
): CbConnectInstantPaymentParsed {
  const trimmed = body.trim();
  if (!trimmed) return {};

  try {
    const json = JSON.parse(trimmed) as unknown;
    const transactionStatus = deepFindString(json, [
      "transactionStatus",
      "transactionIndividualStatus",
    ]);
    const paymentReferenceStatus = deepFindString(json, [
      "status",
      "paymentStatus",
    ]);
    const serviceRequestId = deepFindString(json, [
      "identifier",
      "serviceRequestId",
      "service-request-identifier",
      "serviceRequestIdentifier",
    ]);
    const serviceRequestDateTime = deepFindString(json, [
      "date-time",
      "creationDateTime",
      "serviceRequestDateTime",
    ]);
    const paymentReferencePaymentId = deepFindString(json, [
      "paymentIdentification",
      "statusIdentification",
      "paymentReferencePaymentId",
    ]);
    const paymentRefReasonCode = deepFindString(json, ["reasonCode"]);
    const endToEndIdentification = deepFindString(json, [
      "endToEndIdentification",
      "endToEndId",
      "originalEndToEndIdentification",
    ]);

    const parts = [
      transactionStatus ? `TX: ${transactionStatus}` : null,
      paymentReferenceStatus ? `Ref: ${paymentReferenceStatus}` : null,
      serviceRequestId ? `Service: ${serviceRequestId}` : null,
    ].filter(Boolean);

    return {
      transactionStatus,
      paymentReferenceStatus,
      serviceRequestId,
      serviceRequestDateTime,
      paymentReferencePaymentId,
      paymentRefReasonCode,
      endToEndIdentification,
      summary: parts.length > 0 ? parts.join(" · ") : undefined,
    };
  } catch {
    return { summary: trimmed.slice(0, 240) };
  }
}

export function mapInstantPaymentStatusToSepaStatus(parsed: {
  transactionStatus?: string;
  paymentReferenceStatus?: string;
}): CbConnectSepaPaymentStatus {
  const tx = (parsed.transactionStatus ?? "").trim().toUpperCase();
  const ref = (parsed.paymentReferenceStatus ?? "").trim().toUpperCase();

  if (ref === "FAILED" || tx === "RJCT" || tx === "FAILED") return "rejected";

  if (
    tx === "ACCP" ||
    tx === "ACWC" ||
    tx === "ACFC" ||
    ref === "COMPLETED" ||
    ref === "DONE"
  ) {
    return "completed";
  }

  // Laufend bei der Bank → Tab „Bank“ (intern: sent)
  if (
    tx === "PDNG" ||
    tx === "RCVD" ||
    tx === "ACTC" ||
    tx === "ACSP" ||
    tx === "ACSC" ||
    tx === "PART" ||
    ref === "PENDING" ||
    ref === "IN_PROGRESS"
  ) {
    return "sent";
  }

  return "sent";
}
