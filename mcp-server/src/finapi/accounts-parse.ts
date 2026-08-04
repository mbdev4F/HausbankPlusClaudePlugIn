import type {
  FinapiAccountSummary,
  FinapiBankConnectionSummary,
} from "./shared.js";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export function parseFinapiBankConnections(
  raw: unknown
): FinapiBankConnectionSummary[] {
  const root = asRecord(raw);
  const list = Array.isArray(root?.connections)
    ? root!.connections
    : Array.isArray(root?.bankConnections)
      ? root!.bankConnections
      : Array.isArray(raw)
        ? raw
        : [];

  const now = Date.now();
  return list
    .map((item): FinapiBankConnectionSummary | null => {
      const o = asRecord(item);
      if (!o || typeof o.id !== "number") return null;
      const bank = asRecord(o.bank);
      return {
        id: o.id,
        name: typeof o.name === "string" ? o.name : `Verbindung ${o.id}`,
        bankName:
          typeof bank?.name === "string"
            ? bank.name
            : typeof o.bankName === "string"
              ? o.bankName
              : null,
        updatedAt: now,
      };
    })
    .filter((x): x is FinapiBankConnectionSummary => x !== null);
}

export function parseFinapiAccounts(raw: unknown): FinapiAccountSummary[] {
  const root = asRecord(raw);
  const list = Array.isArray(root?.accounts)
    ? root!.accounts
    : Array.isArray(raw)
      ? raw
      : [];

  const now = Date.now();
  return list
    .map((item): FinapiAccountSummary | null => {
      const o = asRecord(item);
      if (!o || typeof o.id !== "number") return null;
      const balance = asRecord(o.balance);
      return {
        id: o.id,
        name:
          typeof o.accountName === "string" ? o.accountName : `Konto ${o.id}`,
        iban: typeof o.iban === "string" ? o.iban : null,
        accountType: typeof o.accountType === "string" ? o.accountType : null,
        balance:
          typeof balance?.value === "number"
            ? balance.value
            : typeof o.balance === "number"
              ? o.balance
              : null,
        currency:
          typeof balance?.currency === "string"
            ? balance.currency
            : typeof o.currency === "string"
              ? o.currency
              : null,
        bankConnectionId:
          typeof o.bankConnectionId === "number" ? o.bankConnectionId : null,
        syncedAt: now,
      };
    })
    .filter((x): x is FinapiAccountSummary => x !== null);
}
