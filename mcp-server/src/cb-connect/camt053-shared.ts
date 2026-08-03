/**
 * CAMT.053.001.02 — Bank-to-Customer Statement (ISO 20022).
 * Persistierte Felder entsprechen den im XML vorkommenden XSD-Elementen.
 */

export const CAMT053_SCHEMA = "camt.053.001.02" as const;

export type Camt053ImportSource =
  | "config-import"
  | "api-load"
  | "statements-ui";

export type Camt053FieldRow = {
  /** XPath-ähnlicher Pfad, z. B. BkToCstmrStmt.Stmt[0].Ntry[1].Amt */
  path: string;
  value: string;
  /** XML-Attribute am Element (z. B. Ccy auf Amt). */
  attributes?: Record<string, string>;
};

export type Camt053Summary = {
  messageId: string | null;
  creationDateTime: string | null;
  statementCount: number;
  entryCount: number;
  balanceCount: number;
  accountIdentifiers: string[];
  currencies: string[];
  periodFrom: string | null;
  periodTo: string | null;
};

export type Camt053StoredDocument = {
  id: string;
  teamId: string;
  schemaVersion: typeof CAMT053_SCHEMA;
  source: Camt053ImportSource;
  sourceRequestId: string | null;
  importedAt: number;
  messageId: string | null;
  summary: Camt053Summary;
  /** Alle im XML vorkommenden Blattwerte (XSD-Feldpfade). */
  fields: Camt053FieldRow[];
  /** Vollständiger geparster Baum (Namespace-stripped). */
  parsedTree: Record<string, unknown>;
  rawXml: string;
};

export type Camt053DocumentsPublic = {
  documents: Camt053StoredDocument[];
  updatedAt: number | null;
};

export type Camt053ImportResult =
  | { ok: true; document: Camt053StoredDocument }
  | { ok: false; error: string };
