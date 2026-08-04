/** finAPI Web Form 2.0 — Endzustände (siehe finAPI-Doku / Zahlungslink-Flow). */
export const FINAPI_WEB_FORM_FINAL_STATUSES = new Set([
  "COMPLETED",
  "COMPLETED_WITH_ERROR",
  "ABORTED",
  "EXPIRED",
  "CANCELLED",
]);

export function isFinapiWebFormFinalStatus(status: string): boolean {
  return FINAPI_WEB_FORM_FINAL_STATUSES.has(status.trim().toUpperCase());
}

/** Access-Payment-ID aus Web-Form-Antwort (payload.paymentId). */
export function finapiPaymentIdFromWebForm(
  webForm: Record<string, unknown>
): number | null {
  const payload = webForm.payload;
  if (!payload || typeof payload !== "object") return null;
  const pid = (payload as { paymentId?: unknown }).paymentId;
  return typeof pid === "number" && Number.isFinite(pid) ? pid : null;
}

/** Bankverbindungs-ID nach bankConnectionImport (payload.bankConnectionId). */
export function finapiBankConnectionIdFromWebForm(
  webForm: Record<string, unknown>
): number | null {
  const payload = webForm.payload;
  if (!payload || typeof payload !== "object") return null;
  const raw = (payload as { bankConnectionId?: unknown }).bankConnectionId;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw.trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function parseStoredFinapiPaymentId(
  stored: string | undefined
): number | null {
  const raw = stored?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
