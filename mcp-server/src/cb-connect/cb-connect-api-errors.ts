/** Extrahiert Fehlermeldungen aus Deutsche-Bank-CB-Connect JSON-Antworten. */
export function extractCbConnectApiError(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return null;
  try {
    const json = JSON.parse(trimmed) as unknown;
    if (!json || typeof json !== "object") return null;
    const root = json as Record<string, unknown>;

    const errors = root.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (first && typeof first === "object") {
        const detail = (first as { detail?: unknown }).detail;
        if (typeof detail === "string" && detail.trim()) return detail.trim();
        const title = (first as { title?: unknown }).title;
        if (typeof title === "string" && title.trim()) return title.trim();
      }
    }

    for (const key of ["detail", "message", "error", "additionalInfo"]) {
      const v = root[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  } catch {
    return trimmed.length <= 500 ? trimmed : trimmed.slice(0, 500);
  }
  return null;
}

export function normalizeSwiftBic(bic: string): string {
  const b = bic.replace(/\s/g, "").toUpperCase();
  if (b.length === 8) return `${b}XXX`;
  return b;
}

export function isValidSepaIban(iban: string): boolean {
  const n = iban.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(n)) return false;
  if (n.startsWith("DE")) return n.length === 22;
  return n.length >= 15 && n.length <= 34;
}
