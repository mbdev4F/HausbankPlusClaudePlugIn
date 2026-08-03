/** Öffentliche Konto-ID in der Kontenübersicht: `cb-connect:{linkedAccountUuid}` */

export const CB_CONNECT_ACCOUNT_ID_PREFIX = "cb-connect:";

/** Statement-Konto-ID in der Kontoauszüge-App: `cb-connect-stmt:{linkedAccountUuid}` */
export const CB_CONNECT_STMT_ACCOUNT_ID_PREFIX = "cb-connect-stmt:";

export function isCbConnectBankingAccountId(accountId: string): boolean {
  const raw = accountId?.trim() ?? "";
  if (!raw) return false;
  try {
    return decodeURIComponent(raw).startsWith(CB_CONNECT_ACCOUNT_ID_PREFIX);
  } catch {
    return raw.startsWith(CB_CONNECT_ACCOUNT_ID_PREFIX);
  }
}

export function linkedAccountIdFromCbConnectAccountId(
  accountId: string
): string | null {
  const raw = accountId?.trim() ?? "";
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* use raw */
  }
  if (!decoded.startsWith(CB_CONNECT_ACCOUNT_ID_PREFIX)) return null;
  const id = decoded.slice(CB_CONNECT_ACCOUNT_ID_PREFIX.length).trim();
  return id || null;
}

export function isCbConnectStatementAccountId(accountId: string): boolean {
  const raw = accountId?.trim() ?? "";
  if (!raw) return false;
  try {
    return decodeURIComponent(raw).startsWith(CB_CONNECT_STMT_ACCOUNT_ID_PREFIX);
  } catch {
    return raw.startsWith(CB_CONNECT_STMT_ACCOUNT_ID_PREFIX);
  }
}

export function linkedAccountIdFromCbConnectStatementAccountId(
  accountId: string
): string | null {
  const raw = accountId?.trim() ?? "";
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* use raw */
  }
  if (!decoded.startsWith(CB_CONNECT_STMT_ACCOUNT_ID_PREFIX)) return null;
  const id = decoded.slice(CB_CONNECT_STMT_ACCOUNT_ID_PREFIX.length).trim();
  return id || null;
}

export function cbConnectStatementAccountId(linkedAccountId: string): string {
  return `${CB_CONNECT_STMT_ACCOUNT_ID_PREFIX}${linkedAccountId.trim()}`;
}
