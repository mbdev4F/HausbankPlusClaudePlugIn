/**
 * Saldo aus CB-Connect Account-Balance JSON (Deutsche Bank customerAccount-Format).
 */

export type CbConnectParsedBalance = {
  availableBalance: number;
  currentBalance: number;
  currency: string;
  /** Anzeige-Saldo (bevorzugt verfügbar) */
  balance: number;
};

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickBalanceAmount(
  obj: unknown
): { value: number; currency: string | null } | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const amount = o.balanceAmount;
  if (amount && typeof amount === "object") {
    const a = amount as Record<string, unknown>;
    const value = asNumber(a.value);
    if (value === null) return null;
    const currency =
      typeof a.currency === "string" ? a.currency.trim() : null;
    return { value, currency };
  }
  const direct = asNumber(o.value) ?? asNumber(o.amount) ?? asNumber(o.balance);
  if (direct === null) return null;
  const currency =
    typeof o.currency === "string" ? o.currency.trim() : null;
  return { value: direct, currency };
}

function parseCustomerAccount(
  customerAccount: Record<string, unknown>
): CbConnectParsedBalance | null {
  const currencyFallback =
    typeof customerAccount.accountCurrency === "string"
      ? customerAccount.accountCurrency.trim()
      : null;

  const balances = customerAccount.accountBalances;
  if (!balances || typeof balances !== "object") return null;

  const b = balances as Record<string, unknown>;
  const avail = pickBalanceAmount(b.availableBalance);
  const curr = pickBalanceAmount(b.currentBalance);

  const currency =
    avail?.currency ??
    curr?.currency ??
    currencyFallback ??
    "EUR";

  const availableBalance = avail?.value ?? curr?.value ?? 0;
  const currentBalance = curr?.value ?? avail?.value ?? 0;

  return {
    availableBalance,
    currentBalance,
    currency,
    balance: availableBalance,
  };
}

export function parseCbConnectBalanceFromBody(body: string): CbConnectParsedBalance {
  let json: unknown;
  try {
    json = JSON.parse(body) as unknown;
  } catch {
    return {
      availableBalance: 0,
      currentBalance: 0,
      currency: "EUR",
      balance: 0,
    };
  }

  if (!json || typeof json !== "object") {
    return {
      availableBalance: 0,
      currentBalance: 0,
      currency: "EUR",
      balance: 0,
    };
  }

  const root = json as Record<string, unknown>;

  const customerAccount = root.customerAccount;
  if (customerAccount && typeof customerAccount === "object") {
    const parsed = parseCustomerAccount(
      customerAccount as Record<string, unknown>
    );
    if (parsed) return parsed;
  }

  const directAvail = asNumber(root.availableBalance);
  const directCurr = asNumber(root.currentBalance);
  const direct = directAvail ?? directCurr ?? asNumber(root.balance);
  if (direct !== null) {
    const currency =
      typeof root.currency === "string"
        ? root.currency.trim()
        : typeof root.accountCurrency === "string"
          ? root.accountCurrency.trim()
          : "EUR";
    return {
      availableBalance: directAvail ?? direct,
      currentBalance: directCurr ?? direct,
      currency,
      balance: directAvail ?? directCurr ?? direct,
    };
  }

  return {
    availableBalance: 0,
    currentBalance: 0,
    currency: "EUR",
    balance: 0,
  };
}
