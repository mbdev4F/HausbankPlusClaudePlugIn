/**
 * Manuell konfigurierte Deutsche-Bank-CB-Connect-Konten (pro Team).
 * Client-sicher — keine Server-Imports.
 */

export type CbConnectLinkedAccountPurpose = "balance" | "statements";

export type CbConnectLinkedAccount = {
  id: string;
  iban: string;
  branchIdentifier: string;
  accountCurrency: string;
  accountIdentifier: string;
  /** SWIFT-BIC der Auftraggeberbank (z. B. DEUTDEFFXXX) — für SEPA Instant Payment */
  bic?: string;
  /** Anzeigename; leer → erste 4 IBAN-Ziffern */
  label?: string;
  /** Empfängerkonto für Patientenportal-Zahlungen (pro Team nur eines). */
  patientPayments?: boolean;
  createdAt: number;
};

export type CbConnectLinkedAccountsPublic = {
  accounts: CbConnectLinkedAccount[];
  updatedAt: number | null;
};

export type CbConnectLinkedAccountInput = {
  branchIdentifier: string;
  accountCurrency: string;
  /** IBAN = Account Identifier */
  accountIdentifier: string;
  label?: string;
  bic?: string;
};

export type CbConnectLinkedAccountsSaveResult =
  | { ok: true; data: CbConnectLinkedAccountsPublic }
  | { ok: false; error: string };

export type CbConnectStatementAccountDto = {
  id: string;
  linkedAccountId: string;
  name: string;
  label?: string;
  iban: string;
  branchIdentifier: string;
  accountCurrency: string;
  accountIdentifier: string;
};

/** Normalisierte Kontokennung (IBAN / Account Identifier) für Abgleich Balance ↔ Statements. */
export function normalizeCbConnectAccountKey(raw: string): string {
  return raw.replace(/\s/g, "").toUpperCase();
}

/** Anzeigename: Bezeichnung aus der Konfiguration, sonst erste 4 Ziffern der IBAN. */
export function cbConnectLinkedAccountDisplayName(
  row: Pick<CbConnectLinkedAccount, "label" | "iban" | "accountIdentifier">
): string {
  const label = (row.label ?? "").trim();
  if (label) return label;

  const iban = (row.iban || row.accountIdentifier).replace(/\s/g, "").toUpperCase();
  const digits = iban.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(0, 4);
  if (iban.length >= 4) return iban.slice(0, 4);
  return "Deutsche Bank Konto";
}

function formatIbanGroups(iban: string): string {
  const c = iban.replace(/\s/g, "").toUpperCase();
  return c.replace(/(.{4})/g, "$1 ").trim();
}

/** Anzeige in Kontoauszüge-App: Bezeichnung oder formatierte IBAN (kein 4-Ziffern-Kürzel). */
/** CB-Connect-Konto mit aktivem Patienten-Payments-Haken (Balance-Liste). */
export function cbConnectFindPatientPaymentAccount(
  accounts: CbConnectLinkedAccount[]
): CbConnectLinkedAccount | null {
  return accounts.find((a) => a.patientPayments === true) ?? null;
}

export function cbConnectStatementAccountLabel(
  row: Pick<CbConnectLinkedAccount, "label" | "iban" | "accountIdentifier">
): string {
  const label = (row.label ?? "").trim();
  if (label) return label;
  const iban = (row.iban || row.accountIdentifier).replace(/\s/g, "").toUpperCase();
  if (iban) return formatIbanGroups(iban);
  return "Deutsche Bank Konto";
}
