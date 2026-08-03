/** Lokale SEPA-Zahlungen über Deutsche Bank CB-Connect (ohne BC Payment API). */

import type { PaymentChecks } from "./sepa-payment-types.js";

export const CB_CONNECT_SEPA_PAYMENT_ID_PREFIX = "cb-connect:";

export type CbConnectSepaPaymentStatus =
  | "draft"
  | "validation"
  | "pending"
  | "sent"
  | "completed"
  | "rejected";

export type CbConnectSepaPaymentRecord = {
  id: string;
  auditTraceId?: string;
  accountNo: string;
  recipient: string;
  iban: string;
  bic: string;
  amount: number;
  currency: string;
  purpose: string;
  partnerType?: "Company" | "Person";
  referencePaymentId?: string;
  debtorIban?: string;
  debtorName?: string;
  debtorBic?: string;
  status: CbConnectSepaPaymentStatus;
  createdAt: string;
  checks?: PaymentChecks;
  voPId?: string;
  voPMatchCode?: string;
  /** Zeitpunkt der letzten erfolgreichen VoP-Prüfung (ISO, 15 Tage gültig — wie BC VoPCheckedAt) */
  voPCheckedAt?: string;
  /** CB-Connect Instant Payment — Korrelation / E2E / Bankstatus */
  correlationId?: string;
  endToEndIdentification?: string;
  bankTransactionStatus?: string;
  paymentReferenceStatus?: string;
  serviceRequestId?: string;
  paymentReferencePaymentId?: string;
};

export type CbConnectSepaPaymentInput = {
  accountNo: string;
  recipient: string;
  iban: string;
  bic: string;
  amount: number;
  currency: string;
  purpose: string;
  partnerType?: "Company" | "Person";
  referencePaymentId?: string;
  debtorIban?: string;
  debtorName?: string;
  debtorBic?: string;
};

export type CbConnectSepaPaymentPatch = Partial<
  Omit<CbConnectSepaPaymentRecord, "id" | "createdAt">
>;

export type CbConnectSepaPaymentsPublic = {
  payments: CbConnectSepaPaymentRecord[];
  updatedAt: number | null;
};

export function isCbConnectSepaPaymentId(id: string): boolean {
  return id.startsWith(CB_CONNECT_SEPA_PAYMENT_ID_PREFIX);
}

export function cbConnectSepaPaymentPublicId(rawId: string): string {
  return rawId.startsWith(CB_CONNECT_SEPA_PAYMENT_ID_PREFIX)
    ? rawId
    : `${CB_CONNECT_SEPA_PAYMENT_ID_PREFIX}${rawId}`;
}

export function cbConnectSepaPaymentStorageId(publicId: string): string {
  return publicId.startsWith(CB_CONNECT_SEPA_PAYMENT_ID_PREFIX)
    ? publicId.slice(CB_CONNECT_SEPA_PAYMENT_ID_PREFIX.length)
    : publicId;
}
