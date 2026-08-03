/**
 * Statement-Request-Antwort (Deutsche Bank CB-Connect).
 */

import { XMLParser } from "fast-xml-parser";

/** Kontoauszugs-Typ im POST-Body (`type`). */
export type CbConnectStatementType = "EOD" | "INT";

export const CB_CONNECT_STATEMENT_TYPE_LABELS: Record<
  CbConnectStatementType,
  string
> = {
  EOD: "EOD (End of Day)",
  INT: "INT (Intraday)",
};

export function normalizeCbConnectStatementType(
  value: unknown
): CbConnectStatementType {
  const t = typeof value === "string" ? value.trim().toUpperCase() : "";
  return t === "INT" ? "INT" : "EOD";
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function serviceRequestBlock(
  o: Record<string, unknown>
): Record<string, unknown> | null {
  const block = o.serviceRequest ?? o["service-request"];
  if (block && typeof block === "object" && !Array.isArray(block)) {
    return block as Record<string, unknown>;
  }
  return null;
}

function walkForServiceRequestId(value: unknown, depth = 0): string | null {
  if (depth > 6 || value == null) return null;
  if (typeof value === "string" && value.trim()) {
    return null;
  }
  if (typeof value !== "object") return null;

  const o = value as Record<string, unknown>;
  const sr = serviceRequestBlock(o);
  if (sr) {
    const fromBlock = pickString(sr, [
      "identifier",
      "serviceRequestIdentifier",
      "service-request-identifier",
      "serviceRequestId",
      "service-request-id",
    ]);
    if (fromBlock) return fromBlock;
  }

  const direct = pickString(o, [
    "serviceRequestIdentifier",
    "service-request-identifier",
    "serviceRequestId",
    "service-request-id",
    "requestIdentifier",
    "requestId",
  ]);
  if (direct) return direct;

  for (const child of Object.values(o)) {
    if (child && typeof child === "object") {
      const nested = walkForServiceRequestId(child, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}

export function parseCbConnectStatementRequestId(body: string): string | null {
  try {
    const json = JSON.parse(body) as unknown;
    return walkForServiceRequestId(json);
  } catch {
    return null;
  }
}

export function buildCbConnectStatementRequestBody(params: {
  branchIdentifier: string;
  accountCurrency: string;
  accountIdentifier: string;
  fromDate: string;
  toDate: string;
  type?: CbConnectStatementType | string;
  /** API-Version im Request-Body (z. B. V2, V8). */
  version?: string;
}): Record<string, string> {
  const versionRaw = (params.version ?? "V2").trim();
  const version = versionRaw || "V2";
  return {
    fromDate: params.fromDate.trim(),
    toDate: params.toDate.trim(),
    accountIdentifier: params.accountIdentifier.replace(/\s/g, "").toUpperCase(),
    bankIdentifier: params.branchIdentifier.trim(),
    currency: params.accountCurrency.trim() || "EUR",
    type: normalizeCbConnectStatementType(params.type),
    version,
  };
}

export function formatCbConnectStatementRequestBody(
  params: Parameters<typeof buildCbConnectStatementRequestBody>[0]
): string {
  return JSON.stringify(buildCbConnectStatementRequestBody(params), null, 2);
}

/** Wie BC: `CbConStmtLoadUrl` + CorrelationId + `&offset=1` */
export const CB_CONNECT_STATEMENT_LOAD_OFFSET = 1;

function appendStatementLoadOffset(url: string): string {
  const u = url.trim();
  if (!u) return "";
  if (/[?&]offset=/i.test(u)) return u;
  return `${u}&offset=${CB_CONNECT_STATEMENT_LOAD_OFFSET}`;
}

/**
 * Load-URL wie in Business Central:
 * `Setup.CbConStmtLoadUrl + AccountStmtCorrelationId + '&offset=1'`
 */
export function resolveCbConnectStatementLoadUrl(
  loadUrlTemplate: string,
  serviceRequestId: string
): string {
  const base = loadUrlTemplate.trim();
  const id = encodeURIComponent(serviceRequestId.trim());
  if (!base) return "";

  let url: string;
  if (base.endsWith("=")) {
    url = `${base}${id}`;
  } else if (base.includes("{serviceRequestIdentifier}")) {
    url = base.replace(/\{serviceRequestIdentifier\}/g, id);
  } else if (base.includes("%1")) {
    url = base.replace(/%1/g, id);
  } else {
    const sep = base.includes("?") ? "&" : "?";
    url = `${base}${sep}service-request-identifier=${id}`;
  }

  return appendStatementLoadOffset(url);
}

export type CbConnectStatementRequestStatus =
  | "processing"
  | "ready"
  | "failed";

const PROCESSING_TOKENS = new Set([
  "PROCESSING",
  "PENDING",
  "IN_PROGRESS",
  "INPROGRESS",
  "ACCEPTED",
  "QUEUED",
  "WAITING",
]);

const READY_TOKENS = new Set([
  "COMPLETED",
  "COMPLETE",
  "READY",
  "SUCCESS",
  "DONE",
  "AVAILABLE",
  "FINISHED",
]);

const FAILED_TOKENS = new Set([
  "FAILED",
  "ERROR",
  "REJECTED",
  "CANCELLED",
  "CANCELED",
  "ABORTED",
]);

export function normalizeStatementStatusToken(
  raw: string | null | undefined
): CbConnectStatementRequestStatus | null {
  const t = (raw ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (!t) return null;
  if (READY_TOKENS.has(t)) return "ready";
  if (FAILED_TOKENS.has(t)) return "failed";
  if (PROCESSING_TOKENS.has(t)) return "processing";
  if (t.includes("PROCESS") || t.includes("PEND") || t.includes("WAIT")) {
    return "processing";
  }
  if (t.includes("FAIL") || t.includes("ERROR") || t.includes("REJECT")) {
    return "failed";
  }
  if (t.includes("COMPLETE") || t.includes("READY") || t.includes("SUCCESS")) {
    return "ready";
  }
  return null;
}

function walkForStatus(value: unknown, depth = 0): string | null {
  if (depth > 8 || value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value !== "object") return null;

  const o = value as Record<string, unknown>;
  const direct = pickString(o, [
    "status",
    "requestStatus",
    "statementStatus",
    "processingStatus",
    "serviceRequestStatus",
    "state",
  ]);
  if (direct) return direct;

  for (const child of Object.values(o)) {
    if (child && typeof child === "object") {
      const nested = walkForStatus(child, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}

/** Load-Antwort während der Erstellung (Deutsche Bank). */
export type CbConnectStatementGetResponse = {
  serviceRequestId: string | null;
  serviceRequestDateTime: string | null;
  statementStatus: string | null;
};

export type CbConnectStatementLoadParseResult = {
  status: CbConnectStatementRequestStatus;
  rawStatus: string | null;
  statementLoadStatus: string | null;
  serviceRequestDateTime: string | null;
  isCamtPayload: boolean;
};

const statementGetXmlParser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  removeNSPrefix: true,
});

function asRecord(v: unknown): Record<string, unknown> | undefined {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return undefined;
}

export function isCbConnectStatementGetResponseXml(body: string): boolean {
  return /<StatementGETResponse\b/i.test(body.trim());
}

/** Fertiges CAMT-Kontoauszugs-XML (nicht StatementGETResponse). */
export function isCbConnectCamtStatementXml(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed.startsWith("<")) return false;
  if (isCbConnectStatementGetResponseXml(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  return (
    lower.includes("<document") ||
    lower.includes("bktoacstmt") ||
    lower.includes("camt.053") ||
    lower.includes("camt.052")
  );
}

export function parseCbConnectStatementGetResponseXml(
  body: string
): CbConnectStatementGetResponse | null {
  if (!isCbConnectStatementGetResponseXml(body)) return null;
  try {
    const parsed = statementGetXmlParser.parse(body) as Record<string, unknown>;
    const root =
      asRecord(parsed.StatementGETResponse) ??
      asRecord(parsed.statementgetresponse);
    if (!root) return null;

    const sr = asRecord(root.serviceRequest);
    const stmt = asRecord(root.statement);

    return {
      serviceRequestId: pickString(sr ?? {}, ["identifier"]),
      serviceRequestDateTime: pickString(sr ?? {}, [
        "date-time",
        "dateTime",
        "datetime",
      ]),
      statementStatus: pickString(stmt ?? {}, ["status"]),
    };
  } catch {
    return null;
  }
}

export function formatStatementLoadResponseForStore(body: string): string {
  const getResp = parseCbConnectStatementGetResponseXml(body);
  if (getResp) {
    return JSON.stringify(
      {
        StatementGETResponse: {
          serviceRequest: {
            identifier: getResp.serviceRequestId,
            "date-time": getResp.serviceRequestDateTime,
          },
          statement: { status: getResp.statementStatus },
        },
      },
      null,
      2
    );
  }
  try {
    return JSON.stringify(JSON.parse(body) as unknown, null, 2);
  } catch {
    return body;
  }
}

export function parseCbConnectStatementLoadBody(
  body: string,
  httpStatus?: number
): CbConnectStatementLoadParseResult {
  const trimmed = body.trim();
  const getResp = parseCbConnectStatementGetResponseXml(trimmed);
  if (getResp) {
    const rawStatus = getResp.statementStatus;
    const normalized = normalizeStatementStatusToken(rawStatus);
    return {
      status: normalized ?? "processing",
      rawStatus: rawStatus ?? "PROCESSING",
      statementLoadStatus: rawStatus,
      serviceRequestDateTime: getResp.serviceRequestDateTime,
      isCamtPayload: false,
    };
  }

  if (isCbConnectCamtStatementXml(trimmed)) {
    return {
      status: "ready",
      rawStatus: "CAMT",
      statementLoadStatus: null,
      serviceRequestDateTime: null,
      isCamtPayload: true,
    };
  }

  const legacy = parseCbConnectStatementStatus(trimmed, httpStatus);
  return {
    status: legacy.status,
    rawStatus: legacy.rawStatus,
    statementLoadStatus: legacy.rawStatus,
    serviceRequestDateTime: null,
    isCamtPayload: false,
  };
}

export function parseCbConnectStatementStatus(
  body: string,
  httpStatus?: number
): { status: CbConnectStatementRequestStatus; rawStatus: string | null } {
  const trimmed = body.trim();

  const getResp = parseCbConnectStatementGetResponseXml(trimmed);
  if (getResp) {
    const rawStatus = getResp.statementStatus;
    const normalized = normalizeStatementStatusToken(rawStatus);
    return {
      status: normalized ?? "processing",
      rawStatus: rawStatus ?? "PROCESSING",
    };
  }

  if (isCbConnectCamtStatementXml(trimmed)) {
    return { status: "ready", rawStatus: "CAMT" };
  }

  let rawStatus: string | null = null;
  try {
    const json = JSON.parse(trimmed) as unknown;
    rawStatus = walkForStatus(json);
    const normalized = normalizeStatementStatusToken(rawStatus);
    if (normalized) return { status: normalized, rawStatus };
  } catch {
    /* not JSON */
  }

  if (httpStatus === 202 || httpStatus === 102) {
    return { status: "processing", rawStatus: rawStatus ?? "HTTP_ACCEPTED" };
  }

  if (httpStatus != null && httpStatus >= 400) {
    const lower = trimmed.toLowerCase();
    if (
      lower.includes("processing") ||
      lower.includes("not ready") ||
      lower.includes("not available") ||
      lower.includes("pending")
    ) {
      return { status: "processing", rawStatus: rawStatus ?? `HTTP_${httpStatus}` };
    }
    return { status: "failed", rawStatus: rawStatus ?? `HTTP_${httpStatus}` };
  }

  if (!trimmed) {
    return { status: "processing", rawStatus: rawStatus };
  }

  return { status: "processing", rawStatus: rawStatus ?? "UNKNOWN" };
}

export function detectStatementContentType(
  body: string
): "xml" | "json" | "text" {
  const trimmed = body.trim();
  if (trimmed.startsWith("<")) return "xml";
  try {
    JSON.parse(trimmed);
    return "json";
  } catch {
    return "text";
  }
}
