/**
 * Persistierte Kontoauszugs-Anfragen (pro Team).
 */

import type { CbConnectStatementType } from "./cb-connect-statements-parse.js";

export type CbConnectStatementRequestStatus =
  | "processing"
  | "ready"
  | "failed";

export type CbConnectStatementRequestRecord = {
  id: string;
  linkedAccountId: string;
  accountName: string;
  accountIban: string;
  fromDate: string;
  toDate: string;
  statementType: CbConnectStatementType;
  serviceRequestId: string;
  /** Aus Load-XML `<statement><status>` (z. B. PROCESSING). */
  statementLoadStatus: string | null;
  /** Aus Load-XML `<serviceRequest><date-time>`. */
  serviceRequestDateTime: string | null;
  status: CbConnectStatementRequestStatus;
  rawStatus: string | null;
  requestResponseJson: string;
  loadResponseJson: string | null;
  /** Zeitpunkt des letzten Statement-Load-API-Aufrufs (ms). */
  lastLoadAt: number | null;
  loadBody: string | null;
  loadContentType: "xml" | "json" | "text" | null;
  error: string | null;
  createdAt: number;
  updatedAt: number;
  /** Zeitpunkt der erfolgreichen Übernahme ins Kontenmodul (ms). */
  kontenSyncedAt: number | null;
};

export type CbConnectStatementRequestsPublic = {
  requests: CbConnectStatementRequestRecord[];
  updatedAt: number | null;
};

export type CbConnectStatementRequestResult =
  | { ok: true; request: CbConnectStatementRequestRecord }
  | { ok: false; error: string };
