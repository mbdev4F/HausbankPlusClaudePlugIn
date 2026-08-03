import type { CbConnectSepaPaymentRecord } from "./cb-connect-payments-shared.js";

/** VoP-ID ist laut Deutsche Bank / Cash365 15 Tage gültig (Einmalverwendung pro Zahlung). */
export const CB_CONNECT_VOP_VALIDITY_MS = 15 * 24 * 60 * 60 * 1000;

export function isCbConnectVopExpired(voPCheckedAt: string | undefined): boolean {
  const raw = voPCheckedAt?.trim();
  if (!raw) return false;
  const checkedAt = Date.parse(raw);
  if (!Number.isFinite(checkedAt)) return false;
  return Date.now() > checkedAt + CB_CONNECT_VOP_VALIDITY_MS;
}

export function shouldRegenerateCbConnectVopId(
  payment: Pick<
    CbConnectSepaPaymentRecord,
    "voPId" | "voPCheckedAt" | "status"
  >
): boolean {
  if (!payment.voPId?.trim()) return true;
  if (isCbConnectVopExpired(payment.voPCheckedAt)) return true;
  if (
    payment.status === "sent" ||
    payment.status === "completed" ||
    payment.status === "rejected"
  ) {
    return true;
  }
  return false;
}

export type CbConnectVopApprovalGuardResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * VoP muss vor Freigabe (validation → pending) abgeschlossen sein — wie BC InstantPayment VoPId-Pflicht.
 */
export function validateCbConnectVopForApproval(
  payment: Pick<CbConnectSepaPaymentRecord, "voPId" | "voPCheckedAt">
): CbConnectVopApprovalGuardResult {
  const voPId = payment.voPId?.trim();
  if (!voPId) {
    return {
      ok: false,
      error:
        "Verification of Payee (VoP) ist erforderlich — bitte zuerst VoP-Prüfung durchführen, bevor freigegeben werden kann.",
    };
  }

  if (!payment.voPCheckedAt?.trim()) {
    return {
      ok: false,
      error:
        "VoP-Prüfung ist unvollständig — bitte VoP erneut ausführen, bevor freigegeben werden kann.",
    };
  }

  if (isCbConnectVopExpired(payment.voPCheckedAt)) {
    return {
      ok: false,
      error:
        "Die VoP-Prüfung ist abgelaufen (15 Tage). Bitte eine neue VoP-Prüfung durchführen, bevor freigegeben werden kann.",
    };
  }

  return { ok: true };
}

export type CbConnectVopInstantPaymentGuardResult =
  | { ok: true; voPId: string }
  | { ok: false; error: string; httpStatus: number };

/**
 * Prüft, ob die gespeicherte VoP-Prüfung für SEPA Instant Initiation verwendet werden darf.
 * Die VoP-ID wird als Header `x-verificationofpayee-identifier` übergeben (wie Cash365 InstantPayment).
 */
export function validateCbConnectVopForInstantPayment(
  payment: Pick<
    CbConnectSepaPaymentRecord,
    "voPId" | "voPCheckedAt" | "checks"
  >
): CbConnectVopInstantPaymentGuardResult {
  const voPId = payment.voPId?.trim();
  if (!voPId) {
    return {
      ok: false,
      httpStatus: 400,
      error:
        "Verification of Payee (VoP) ist erforderlich — bitte zuerst VoP-Prüfung durchführen.",
    };
  }

  if (!payment.voPCheckedAt?.trim()) {
    return {
      ok: false,
      httpStatus: 400,
      error:
        "VoP-Prüfung ist unvollständig — bitte VoP erneut ausführen (VoP-ID fehlt in den Zahlungsdaten).",
    };
  }

  if (isCbConnectVopExpired(payment.voPCheckedAt)) {
    return {
      ok: false,
      httpStatus: 400,
      error:
        "Die VoP-Prüfung ist abgelaufen (VoP-ID ist 15 Tage gültig). Bitte eine neue VoP-Prüfung durchführen.",
    };
  }

  const vopCheck = payment.checks?.verificationOfPayee;
  if (vopCheck !== "ok" && vopCheck !== "pending" && vopCheck !== "alert") {
    return {
      ok: false,
      httpStatus: 400,
      error:
        "VoP-Prüfung wurde noch nicht durchgeführt — bitte zuerst „Prüfung starten“ ausführen.",
    };
  }

  return { ok: true, voPId };
}
