import {
  cbConnectFetchAccessToken,
  cbConnectLoadStatement,
  cbConnectRequestStatement,
} from "./cb-connect-client.js";
import { CB_CONNECT_SANDBOX_DEFAULTS } from "./cb-connect-sandbox-defaults.js";
import { formatProbeResponseJson } from "./cb-connect-signing-core.js";
import {
  formatCbConnectStatementRequestBody,
  normalizeCbConnectStatementType,
  parseCbConnectStatementLoadBody,
  parseCbConnectStatementRequestId,
  parseCbConnectStatementStatus,
  resolveCbConnectStatementLoadUrl,
  type CbConnectStatementType,
} from "./cb-connect-statements-parse.js";
import { cbConnectEndpointsGetPublic } from "./endpoints-store.js";
import {
  nativeBankGetResolvedCredentials,
  validateCredentialsForBankingApi,
} from "./resolved-credentials.js";

export type CbConnectStatementRequestParams = {
  branchIdentifier: string;
  accountCurrency: string;
  accountIdentifier: string;
  fromDate: string;
  toDate: string;
  statementType?: CbConnectStatementType;
};

export const resolveUrl = (draft: string | undefined, fallback: string): string => {
  const d = (draft ?? "").trim();
  return d || fallback;
};

export type CbConnectStatementEndpoints = {
  oauthTokenUrl: string;
  statementsRequestUrl: string;
  statementsLoadUrl: string;
  statementsVersion: string;
  statementBodyVersion: "V2" | "V8";
};

export async function cbConnectResolveStatementEndpoints(
  teamId: string
): Promise<
  | { ok: true; endpoints: CbConnectStatementEndpoints }
  | { ok: false; error: string }
> {
  const stored = await cbConnectEndpointsGetPublic(teamId);
  const defaults = CB_CONNECT_SANDBOX_DEFAULTS;
  const statementsVersion = resolveUrl(
    stored.statementsVersion,
    defaults.statementsVersion
  );
  const statementBodyVersion: "V2" | "V8" =
    statementsVersion === "V8" ? "V8" : "V2";

  return {
    ok: true,
    endpoints: {
      oauthTokenUrl: resolveUrl(stored.oauthTokenUrl, defaults.oauthTokenUrl),
      statementsRequestUrl: resolveUrl(
        stored.statementsRequestUrl,
        defaults.statementsRequestUrl
      ),
      statementsLoadUrl: resolveUrl(
        stored.statementsLoadUrl,
        defaults.statementsLoadUrl
      ),
      statementsVersion,
      statementBodyVersion,
    },
  };
}

export type CbConnectStatementRequestApiResult =
  | {
      ok: true;
      requestJson: string;
      requestResponseJson: string;
      serviceRequestId: string;
      httpStatus: number;
      correlationId: string;
      rawStatus: string | null;
      status: ReturnType<typeof parseCbConnectStatementStatus>["status"];
    }
  | { ok: false; error: string; requestJson?: string };

/** Signierter Statement-Request — identisch zur Konfigurations-Probe. */
export async function cbConnectExecuteStatementRequest(
  teamId: string,
  params: CbConnectStatementRequestParams,
  endpointsOverride?: Partial<CbConnectStatementEndpoints>
): Promise<CbConnectStatementRequestApiResult> {
  const tid = teamId?.trim();
  if (!tid) return { ok: false, error: "Team-ID fehlt." };

  const branch = params.branchIdentifier.trim();
  const currency = params.accountCurrency.trim();
  const accountId = params.accountIdentifier.trim();
  const fromDate = params.fromDate.trim();
  const toDate = params.toDate.trim();
  const statementType = normalizeCbConnectStatementType(params.statementType);

  const resolved = await cbConnectResolveStatementEndpoints(tid);
  if (!resolved.ok) return resolved;

  const endpoints = { ...resolved.endpoints, ...endpointsOverride };
  const requestJson = formatCbConnectStatementRequestBody({
    branchIdentifier: branch,
    accountCurrency: currency,
    accountIdentifier: accountId,
    fromDate,
    toDate,
    type: statementType,
    version: endpoints.statementBodyVersion,
  });

  if (!branch || !currency || !accountId) {
    return {
      ok: false,
      error:
        "Bank Identifier, Currency und Account Identifier sind erforderlich.",
      requestJson,
    };
  }
  if (!fromDate || !toDate) {
    return {
      ok: false,
      error: "Von- und Bis-Datum sind erforderlich.",
      requestJson,
    };
  }

  const creds = await nativeBankGetResolvedCredentials(tid);
  const bankingErr = validateCredentialsForBankingApi(creds);
  if (bankingErr) return { ok: false, error: bankingErr, requestJson };

  try {
    const { accessToken } = await cbConnectFetchAccessToken(
      creds,
      endpoints.oauthTokenUrl
    );
    const requestRes = await cbConnectRequestStatement(
      creds,
      endpoints.statementsRequestUrl,
      accessToken,
      requestJson,
      { apiVersion: endpoints.statementsVersion || undefined }
    );

    const serviceRequestId = parseCbConnectStatementRequestId(requestRes.body);
    if (!serviceRequestId) {
      return {
        ok: false,
        error:
          "Statement-Request erfolgreich, aber keine Service-Request-ID in der Antwort gefunden.",
        requestJson,
      };
    }

    const requestStatus = parseCbConnectStatementStatus(
      requestRes.body,
      requestRes.status
    );

    return {
      ok: true,
      requestJson,
      requestResponseJson: formatProbeResponseJson(requestRes.body),
      serviceRequestId,
      httpStatus: requestRes.status,
      correlationId: requestRes.correlationId,
      rawStatus: requestStatus.rawStatus,
      status: requestStatus.status,
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Kontoauszug konnte nicht angefordert werden.",
      requestJson,
    };
  }
}

export type CbConnectStatementLoadApiResult =
  | {
      ok: true;
      loadUrl: string;
      httpStatus: number;
      correlationId: string;
      body: string;
      parsed: ReturnType<typeof parseCbConnectStatementLoadBody>;
    }
  | { ok: false; error: string };

/** Signierter Statement-Load — identisch zur Konfigurations-Probe. */
export async function cbConnectExecuteStatementLoad(
  teamId: string,
  serviceRequestId: string,
  endpointsOverride?: Partial<CbConnectStatementEndpoints>
): Promise<CbConnectStatementLoadApiResult> {
  const tid = teamId?.trim();
  const id = serviceRequestId?.trim();
  if (!tid) return { ok: false, error: "Team-ID fehlt." };
  if (!id) return { ok: false, error: "Service-Request-Identifier fehlt." };

  const resolved = await cbConnectResolveStatementEndpoints(tid);
  if (!resolved.ok) return resolved;

  const endpoints = { ...resolved.endpoints, ...endpointsOverride };
  const loadUrl = resolveCbConnectStatementLoadUrl(
    endpoints.statementsLoadUrl,
    id
  );
  if (!loadUrl) {
    return { ok: false, error: "Statements-Load-URL ist nicht konfiguriert." };
  }

  const creds = await nativeBankGetResolvedCredentials(tid);
  const bankingErr = validateCredentialsForBankingApi(creds);
  if (bankingErr) return { ok: false, error: bankingErr };

  try {
    const { accessToken } = await cbConnectFetchAccessToken(
      creds,
      endpoints.oauthTokenUrl
    );
    const loadRes = await cbConnectLoadStatement(
      creds,
      loadUrl,
      accessToken,
      {
        apiVersion: endpoints.statementsVersion || undefined,
        allowErrorStatus: true,
      }
    );

    return {
      ok: true,
      loadUrl,
      httpStatus: loadRes.status,
      correlationId: loadRes.correlationId,
      body: loadRes.body,
      parsed: parseCbConnectStatementLoadBody(loadRes.body, loadRes.status),
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Statement-Load fehlgeschlagen.",
    };
  }
}
