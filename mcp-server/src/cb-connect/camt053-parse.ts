import { XMLParser } from "fast-xml-parser";

import { CAMT053_SCHEMA } from "./camt053-shared.js";
import type {
  Camt053FieldRow,
  Camt053Summary,
} from "./camt053-shared.js";
import { isCbConnectCamtStatementXml } from "./cb-connect-statements-parse.js";

const camt053Parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  removeNSPrefix: true,
  parseTagValue: false,
  /** Text + Attribute: { "#text": "…", "@_Ccy": "EUR" } */
  textNodeName: "#text",
});

export type Camt053ParseResult = {
  schemaVersion: typeof CAMT053_SCHEMA;
  messageId: string | null;
  summary: Camt053Summary;
  fields: Camt053FieldRow[];
  parsedTree: Record<string, unknown>;
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

function statementsFromBk(
  bk: Record<string, unknown> | undefined
): Record<string, unknown>[] {
  const raw = bk?.Stmt;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((s) => asRecord(s))
      .filter((s): s is Record<string, unknown> => !!s);
  }
  const one = asRecord(raw);
  return one ? [one] : [];
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

function scalarToString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? "true" : "false";
  return pickString(v);
}

/**
 * Flacht den geparsten CAMT-Baum zu Feldzeilen (alle XSD-Elemente/Attribute im XML).
 */
export function flattenCamt053Tree(
  node: unknown,
  path = "",
  out: Camt053FieldRow[] = []
): Camt053FieldRow[] {
  if (node === null || node === undefined) return out;

  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    const value = scalarToString(node);
    if (value != null && path) {
      out.push({ path, value });
    }
    return out;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      const next = path ? `${path}[${index}]` : `[${index}]`;
      flattenCamt053Tree(item, next, out);
    });
    return out;
  }

  if (typeof node !== "object") return out;

  const o = node as Record<string, unknown>;
  const attrs = extractAttributes(o);
  const text = scalarToString(o["#text"]);

  if (text != null && path) {
    out.push({
      path,
      value: text,
      ...(attrs ? { attributes: attrs } : {}),
    });
    return out;
  }

  for (const [key, val] of Object.entries(o)) {
    if (key === "#text" || key.startsWith("@_")) continue;
    const nextPath = path ? `${path}.${key}` : key;
    flattenCamt053Tree(val, nextPath, out);
  }

  return out;
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

function amountCurrency(ntry: Record<string, unknown>): string | null {
  const amt = asRecord(ntry.Amt);
  if (!amt) return null;
  const attrs = extractAttributes(amt);
  return attrs?.Ccy ?? null;
}

function buildSummary(root: Record<string, unknown>): Camt053Summary {
  const doc = asRecord(root.Document) ?? root;
  const bk = asRecord(doc.BkToCstmrStmt);
  const grp = asRecord(bk?.GrpHdr);
  const stmts = statementsFromBk(bk);

  const accountIdentifiers: string[] = [];
  const currencies = new Set<string>();
  let entryCount = 0;
  let balanceCount = 0;
  let periodFrom: string | null = null;
  let periodTo: string | null = null;

  for (const stmt of stmts) {
    if (!stmt) continue;
    const acctId = accountIdFromAcct(asRecord(stmt.Acct));
    if (acctId && !accountIdentifiers.includes(acctId)) {
      accountIdentifiers.push(acctId);
    }

    const frTo = asRecord(stmt.FrToDt);
    if (frTo) {
      periodFrom = pickString(frTo.FrDtTm) ?? periodFrom;
      periodTo = pickString(frTo.ToDtTm) ?? periodTo;
    }

    for (const bal of asArray(stmt.Bal)) {
      balanceCount += 1;
      const balRec = asRecord(bal);
      const amt = asRecord(balRec?.Amt);
      const ccy = amt ? extractAttributes(amt)?.Ccy : null;
      if (ccy) currencies.add(ccy);
    }

    for (const ntry of asArray(stmt.Ntry)) {
      entryCount += 1;
      const ntryRec = asRecord(ntry);
      const ccy = amountCurrency(ntryRec ?? {});
      if (ccy) currencies.add(ccy);
    }
  }

  return {
    messageId: pickString(grp?.MsgId),
    creationDateTime: pickString(grp?.CreDtTm),
    statementCount: stmts.length,
    entryCount,
    balanceCount,
    accountIdentifiers,
    currencies: [...currencies],
    periodFrom,
    periodTo,
  };
}

export function parseCamt053Xml(xml: string): Camt053ParseResult {
  const trimmed = xml.trim();
  if (!trimmed) {
    throw new Error("XML ist leer.");
  }
  if (!isCbConnectCamtStatementXml(trimmed)) {
    throw new Error(
      "Kein gültiges CAMT.053-Kontoauszugs-XML (Document / BkToCstmrStmt erwartet)."
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = camt053Parser.parse(trimmed) as Record<string, unknown>;
  } catch {
    throw new Error("XML konnte nicht geparst werden.");
  }

  const doc = asRecord(parsed.Document);
  if (!doc?.BkToCstmrStmt) {
    throw new Error("Document.BkToCstmrStmt fehlt im XML.");
  }

  const fields = flattenCamt053Tree(parsed);
  const summary = buildSummary(parsed);
  const grp = asRecord(asRecord(doc.BkToCstmrStmt)?.GrpHdr);

  return {
    schemaVersion: CAMT053_SCHEMA,
    messageId: summary.messageId ?? pickString(grp?.MsgId),
    summary,
    fields,
    parsedTree: parsed,
  };
}
