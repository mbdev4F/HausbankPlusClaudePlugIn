/**
 * Strukturierte CAMT.053-Ansicht für die Kontoauszüge-Analyse.
 */

export type Camt053GroupHeader = {
  messageId: string | null;
  creationDateTime: string | null;
  pageNumber: string | null;
  lastPageIndicator: string | null;
};

export type Camt053BalanceLine = {
  typeCode: string | null;
  amount: string | null;
  currency: string | null;
  creditDebit: string | null;
  date: string | null;
};

export type Camt053StatementInfo = {
  statementId: string | null;
  creationDateTime: string | null;
  accountId: string | null;
  accountOwner: string | null;
  servicerName: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  balances: Camt053BalanceLine[];
};

export type Camt053EntryLine = {
  index: number;
  amount: string | null;
  currency: string | null;
  creditDebit: string | null;
  status: string | null;
  bookingDate: string | null;
  valueDate: string | null;
  accountServicerRef: string | null;
  bankTransactionCode: string | null;
  counterparty: string | null;
  endToEndId: string | null;
  remittanceInfo: string | null;
};

export type Camt053Analysis = {
  groupHeader: Camt053GroupHeader;
  statements: Array<{
    info: Camt053StatementInfo;
    entries: Camt053EntryLine[];
  }>;
};

function asRecord(v: unknown): Record<string, unknown> | undefined {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return undefined;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function pickString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  return null;
}

function extractAttributes(o: Record<string, unknown>): Record<string, string> | undefined {
  const attrs: Record<string, string> = {};
  for (const [key, val] of Object.entries(o)) {
    if (!key.startsWith("@_")) continue;
    const name = key.slice(2);
    const s = pickString(val);
    if (s != null) attrs[name] = s;
  }
  return Object.keys(attrs).length > 0 ? attrs : undefined;
}

function amountFromNode(amt: unknown): { amount: string | null; currency: string | null } {
  const rec = asRecord(amt);
  if (!rec) {
    const s = pickString(amt);
    return { amount: s, currency: null };
  }
  const attrs = extractAttributes(rec);
  const text = pickString(rec["#text"]) ?? pickString(rec);
  return { amount: text, currency: attrs?.Ccy ?? null };
}

function accountIdFromAcct(acct: Record<string, unknown> | undefined): string | null {
  if (!acct) return null;
  const id = asRecord(acct.Id);
  if (!id) return null;
  const iban = pickString(id.IBAN);
  if (iban) return iban;
  const othr = asRecord(id.Othr);
  return pickString(othr?.Id);
}

function balanceTypeCode(bal: Record<string, unknown>): string | null {
  const tp = asRecord(bal.Tp);
  const cdOrPrtry = asRecord(tp?.CdOrPrtry);
  return pickString(cdOrPrtry?.Cd) ?? pickString(cdOrPrtry?.Prtry);
}

function balanceDate(bal: Record<string, unknown>): string | null {
  const dt = asRecord(bal.Dt);
  return pickString(dt?.Dt) ?? pickString(dt?.DtTm);
}

function bankTxCode(ntry: Record<string, unknown>): string | null {
  const bk = asRecord(ntry.BkTxCd);
  const domn = asRecord(bk?.Domn);
  const cd = pickString(domn?.Cd);
  const fmly = asRecord(domn?.Fmly);
  const fmlyCd = pickString(fmly?.Cd);
  const sub = pickString(fmly?.SubFmlyCd);
  const parts = [cd, fmlyCd, sub].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : null;
}

function entryCounterparty(ntry: Record<string, unknown>): string | null {
  for (const dtl of asArray(ntry.NtryDtls)) {
    const dtlRec = asRecord(dtl);
    for (const tx of asArray(dtlRec?.TxDtls)) {
      const txRec = asRecord(tx);
      const parties = asRecord(txRec?.RltdPties);
      const dbtr = pickString(asRecord(parties?.Dbtr)?.Nm);
      if (dbtr) return dbtr;
      const cdtr = pickString(asRecord(parties?.Cdtr)?.Nm);
      if (cdtr) return cdtr;
    }
  }
  return null;
}

function entryEndToEndId(ntry: Record<string, unknown>): string | null {
  for (const dtl of asArray(ntry.NtryDtls)) {
    const dtlRec = asRecord(dtl);
    for (const tx of asArray(dtlRec?.TxDtls)) {
      const txRec = asRecord(tx);
      const refs = asRecord(txRec?.Refs);
      const e2e = pickString(refs?.EndToEndId);
      if (e2e) return e2e;
    }
  }
  return null;
}

function entryRemittance(ntry: Record<string, unknown>): string | null {
  for (const dtl of asArray(ntry.NtryDtls)) {
    const dtlRec = asRecord(dtl);
    for (const tx of asArray(dtlRec?.TxDtls)) {
      const txRec = asRecord(tx);
      const rmt = asRecord(txRec?.RmtInf);
      const ustrd = pickString(rmt?.Ustrd);
      if (ustrd) return ustrd;
    }
  }
  return null;
}

function parseGroupHeader(bk: Record<string, unknown>): Camt053GroupHeader {
  const grp = asRecord(bk.GrpHdr);
  const pgntn = asRecord(grp?.MsgPgntn);
  return {
    messageId: pickString(grp?.MsgId),
    creationDateTime: pickString(grp?.CreDtTm),
    pageNumber: pickString(pgntn?.PgNb),
    lastPageIndicator: pickString(pgntn?.LastPgInd),
  };
}

function parseStatementInfo(stmt: Record<string, unknown>): Camt053StatementInfo {
  const acct = asRecord(stmt.Acct);
  const frTo = asRecord(stmt.FrToDt);
  const svcr = asRecord(asRecord(acct?.Svcr)?.FinInstnId);

  const balances: Camt053BalanceLine[] = [];
  for (const bal of asArray(stmt.Bal)) {
    const balRec = asRecord(bal);
    if (!balRec) continue;
    const { amount, currency } = amountFromNode(balRec.Amt);
    balances.push({
      typeCode: balanceTypeCode(balRec),
      amount,
      currency,
      creditDebit: pickString(balRec.CdtDbtInd),
      date: balanceDate(balRec),
    });
  }

  return {
    statementId: pickString(stmt.Id),
    creationDateTime: pickString(stmt.CreDtTm),
    accountId: accountIdFromAcct(acct),
    accountOwner: pickString(asRecord(acct?.Ownr)?.Nm),
    servicerName: pickString(svcr?.Nm),
    periodFrom: pickString(frTo?.FrDtTm) ?? pickString(asRecord(frTo?.FrDtTm)?.Dt),
    periodTo: pickString(frTo?.ToDtTm) ?? pickString(asRecord(frTo?.ToDtTm)?.Dt),
    balances,
  };
}

function parseEntryLine(ntry: Record<string, unknown>, index: number): Camt053EntryLine {
  const { amount, currency } = amountFromNode(ntry.Amt);
  const bookg = asRecord(ntry.BookgDt);
  const valDt = asRecord(ntry.ValDt);

  return {
    index,
    amount,
    currency,
    creditDebit: pickString(ntry.CdtDbtInd),
    status: pickString(ntry.Sts),
    bookingDate: pickString(bookg?.DtTm) ?? pickString(bookg?.Dt),
    valueDate: pickString(valDt?.Dt) ?? pickString(valDt?.DtTm),
    accountServicerRef: pickString(ntry.AcctSvcrRef),
    bankTransactionCode: bankTxCode(ntry),
    counterparty: entryCounterparty(ntry),
    endToEndId: entryEndToEndId(ntry),
    remittanceInfo: entryRemittance(ntry),
  };
}

export function buildCamt053Analysis(
  parsedTree: Record<string, unknown>
): Camt053Analysis | null {
  const doc = asRecord(parsedTree.Document) ?? parsedTree;
  const bk = asRecord(doc.BkToCstmrStmt);
  if (!bk) return null;

  const groupHeader = parseGroupHeader(bk);
  const rawStmts = bk.Stmt;
  const stmts = asArray(rawStmts)
    .map((s) => asRecord(s))
    .filter((s): s is Record<string, unknown> => !!s);

  const statements = stmts.map((stmt) => {
    const entries = asArray(stmt.Ntry)
      .map((n) => asRecord(n))
      .filter((n): n is Record<string, unknown> => !!n)
      .map((n, i) => parseEntryLine(n, i + 1));

    return {
      info: parseStatementInfo(stmt),
      entries,
    };
  });

  return { groupHeader, statements };
}

export function formatCamtAmount(
  amount: string | null,
  currency: string | null,
  creditDebit: string | null
): string {
  if (!amount) return "—";
  const num = Number(amount.replace(",", "."));
  const formatted = Number.isFinite(num)
    ? num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount;
  const sign = creditDebit === "DBIT" ? "−" : creditDebit === "CRDT" ? "+" : "";
  const ccy = currency ? ` ${currency}` : "";
  return `${sign}${formatted}${ccy}`.trim();
}

export function formatCamtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}
