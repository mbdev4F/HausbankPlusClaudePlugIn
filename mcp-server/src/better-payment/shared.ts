/**
 * Better Payment (Deutsche Bank) — Payment Gateway.
 * Docs: https://testdashboard.betterpayment.de/docs
 *
 * Methods: Wero (`wero`) and Pay by Bank / RTP (`rtp`).
 */

export type BetterPaymentEnvironment = "sandbox" | "live";

/** API payment_type codes. */
export type BetterPaymentMethodId = "wero" | "rtp";

/** Friendly aliases accepted by MCP tools. */
export type BetterPaymentMethodAlias =
  | BetterPaymentMethodId
  | "pay_by_bank"
  | "pay-by-bank"
  | "vero"; // common misspelling of Wero

export type BetterPaymentMethodMeta = {
  id: BetterPaymentMethodId;
  paymentType: BetterPaymentMethodId;
  title: string;
  description: string;
  aliases: BetterPaymentMethodAlias[];
};

export const BETTER_PAYMENT_METHODS: BetterPaymentMethodMeta[] = [
  {
    id: "wero",
    paymentType: "wero",
    title: "Wero",
    description:
      "Mobile Zahlung der Deutschen Bank — Redirect zur QR-Code-Seite, Bestätigung in der Wero-App.",
    aliases: ["wero", "vero"],
  },
  {
    id: "rtp",
    paymentType: "rtp",
    title: "Pay by Bank",
    description:
      "Pay by Bank (RTP) — Redirect-Zahlung über Open Banking / Deutsche Bank.",
    aliases: ["rtp", "pay_by_bank", "pay-by-bank"],
  },
];

export const BETTER_PAYMENT_SANDBOX_BASE =
  "https://testapi.betterpayment.de";
export const BETTER_PAYMENT_LIVE_BASE = "https://api.betterpayment.de";

export function betterPaymentBaseUrlForEnvironment(
  environment: BetterPaymentEnvironment
): string {
  return environment === "live"
    ? BETTER_PAYMENT_LIVE_BASE
    : BETTER_PAYMENT_SANDBOX_BASE;
}

export function resolveBetterPaymentMethodId(
  raw: string
): BetterPaymentMethodId | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  for (const m of BETTER_PAYMENT_METHODS) {
    if (m.id === key) return m.id;
    if (m.aliases.some((a) => a === key || a.replace(/-/g, "_") === key)) {
      return m.id;
    }
  }
  if (key === "paybybank") return "rtp";
  return null;
}

export function isBetterPaymentMethodId(
  value: string
): value is BetterPaymentMethodId {
  return value === "wero" || value === "rtp";
}

/** Treat completed/paid-ish statuses as success (official: 2=pending, 3=completed). */
export function isBetterPaymentPaidStatus(
  status: string | null | undefined,
  statusCode: number | null | undefined
): boolean {
  const s = (status ?? "").toLowerCase();
  if (
    s === "completed" ||
    s === "successful" ||
    s === "success" ||
    s === "paid" ||
    s === "captured" ||
    s === "pending"
  ) {
    return true;
  }
  return statusCode === 2 || statusCode === 3;
}
