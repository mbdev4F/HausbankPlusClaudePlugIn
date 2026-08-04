/** Öffentliche Konto-ID in der Kontenübersicht: `finapi:{finapiAccountId}` */

export const FINAPI_ACCOUNT_ID_PREFIX = "finapi:";

export function finapiBankingAccountId(finapiAccountId: number): string {
  return `${FINAPI_ACCOUNT_ID_PREFIX}${finapiAccountId}`;
}

export function isFinapiBankingAccountId(accountId: string): boolean {
  const raw = accountId?.trim() ?? "";
  if (!raw) return false;
  try {
    return decodeURIComponent(raw).startsWith(FINAPI_ACCOUNT_ID_PREFIX);
  } catch {
    return raw.startsWith(FINAPI_ACCOUNT_ID_PREFIX);
  }
}

export function finapiAccountIdFromBankingAccountId(
  accountId: string
): number | null {
  const raw = accountId?.trim() ?? "";
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* use raw */
  }
  if (!decoded.startsWith(FINAPI_ACCOUNT_ID_PREFIX)) return null;
  const id = decoded.slice(FINAPI_ACCOUNT_ID_PREFIX.length).trim();
  const n = Number.parseInt(id, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
