import {
  cbConnectFetchAccessToken,
  cbConnectSignedPostResult,
} from "./cb-connect-client.js";
import {
  formatFx4CashInitiationJson,
} from "./cb-connect-fx4cash-build.js";
import {
  formatFx4CashStatusReportJson,
  parseFx4CashInitiationResponse,
  parseFx4CashStatusReportResponse,
  type Fx4CashStatusReportInput,
} from "./cb-connect-fx4cash-parse.js";
import type { Fx4CashInitiationParams } from "./cb-connect-fx4cash-shared.js";
import {
  parseFx4CashValueDateAccepted,
  parseFx4CashValueDateResponse,
} from "./cb-connect-fx4cash-value-date-parse.js";
import {
  defaultFx4CashValueDateParams,
  formatFx4CashValueDateJson,
  FX4CASH_VALUE_DATE_PROBE_SCENARIOS,
  type Fx4CashValueDateParams,
  type Fx4CashValueDateScenario,
} from "./cb-connect-fx4cash-value-date-shared.js";
import {
  createFx4CashCorrelationId,
  formatCbConnectApiTimestamp,
  formatProbeRequestHeaders,
  formatProbeResponseJson,
  resolveFx4CashCorrelationPair,
} from "./cb-connect-signing-core.js";
import { cbConnectEndpointsGetPublic } from "./endpoints-store.js";
import {
  nativeBankGetResolvedCredentials,
  validateCredentialsForBankingApi,
} from "./resolved-credentials.js";

export type Fx4CashInitiationResult =
  | {
      ok: true;
      status: number;
      correlationId: string;
      responseJson: string;
      requestJson: string;
      serviceRequestId?: string;
      endToEndIdentification?: string;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      correlationId?: string;
      responseJson?: string;
      requestJson?: string;
    };

export type Fx4CashStatusReportResult =
  | {
      ok: true;
      status: number;
      correlationId: string;
      responseJson: string;
      requestJson: string;
      transactionStatus?: string;
      serviceRequestId?: string;
      summary?: string;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      correlationId?: string;
      responseJson?: string;
      requestJson?: string;
    };

async function resolveFx4CashBanking(teamId: string) {
  const creds = await nativeBankGetResolvedCredentials(teamId);
  const bankingErr = validateCredentialsForBankingApi(creds);
  if (bankingErr) return { ok: false as const, error: bankingErr };

  const endpoints = await cbConnectEndpointsGetPublic(teamId);
  const { accessToken } = await cbConnectFetchAccessToken(
    creds,
    endpoints.oauthTokenUrl
  );

  return { ok: true as const, creds, accessToken, endpoints };
}

function prepareFx4CashInitiationRequest(
  params?: Partial<Fx4CashInitiationParams>
): {
  requestJson: string;
  correlationId: string;
  endToEndIdentification: string;
} {
  const pair = resolveFx4CashCorrelationPair(params?.endToEndIdentification);
  const requestJson = formatFx4CashInitiationJson({
    ...params,
    endToEndIdentification: pair.endToEndIdentification,
  });
  return {
    requestJson,
    correlationId: pair.correlationId,
    endToEndIdentification: pair.endToEndIdentification,
  };
}

export async function cbConnectFx4CashInitiate(
  teamId: string,
  params?: Partial<Fx4CashInitiationParams>,
  options?: { allowErrorStatus?: boolean }
): Promise<Fx4CashInitiationResult> {
  const tid = teamId?.trim();
  if (!tid) return { ok: false, error: "Team-ID fehlt." };

  const prepared = prepareFx4CashInitiationRequest(params);
  const { requestJson, correlationId, endToEndIdentification } = prepared;
  const ctx = await resolveFx4CashBanking(tid);
  if (!ctx.ok) {
    return { ok: false, error: ctx.error, requestJson };
  }

  const initiationUrl = ctx.endpoints.fx4CashInitiationUrl.trim();
  if (!initiationUrl) {
    return {
      ok: false,
      error: "FX4Cash-Initiierungs-URL ist nicht konfiguriert.",
      requestJson,
    };
  }
  const extraHeaders = {
    "x-customer-identifier": ctx.creds.xCustomerIdentifier,
    "x-correlation-identifier": correlationId,
    "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
  };

  try {
    const res = await cbConnectSignedPostResult(
      ctx.creds,
      initiationUrl,
      ctx.accessToken,
      requestJson,
      extraHeaders
    );

    const responseJson = formatProbeResponseJson(res.body);
    const parsed = parseFx4CashInitiationResponse(res.body);
    const okHttp = res.status >= 200 && res.status < 300;

    if (!okHttp && !options?.allowErrorStatus) {
      return {
        ok: false,
        error: `FX4Cash Initiierung fehlgeschlagen (HTTP ${res.status})`,
        status: res.status,
        correlationId,
        responseJson,
        requestJson,
      };
    }

    if (!okHttp) {
      return {
        ok: false,
        error: `FX4Cash Initiierung: HTTP ${res.status}`,
        status: res.status,
        correlationId,
        responseJson,
        requestJson,
      };
    }

    return {
      ok: true,
      status: res.status,
      correlationId,
      responseJson,
      requestJson,
      serviceRequestId: parsed.serviceRequestId,
      endToEndIdentification:
        parsed.endToEndIdentification ?? endToEndIdentification,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "FX4Cash Initiierung fehlgeschlagen.",
      correlationId,
      requestJson,
    };
  }
}

export async function cbConnectFx4CashStatusReport(
  teamId: string,
  input: Fx4CashStatusReportInput
): Promise<Fx4CashStatusReportResult> {
  const tid = teamId?.trim();
  if (!tid) return { ok: false, error: "Team-ID fehlt." };

  const iban = input.debtorIban?.replace(/\s/g, "").trim();
  const e2e = input.endToEndIdentification?.trim();
  if (!iban) {
    return { ok: false, error: "Debtor-IBAN fehlt (für Status-Enquiry)." };
  }
  if (!e2e) {
    return { ok: false, error: "End-to-End-ID fehlt (für Status-Enquiry)." };
  }

  const requestJson = formatFx4CashStatusReportJson({ debtorIban: iban, endToEndIdentification: e2e });
  const ctx = await resolveFx4CashBanking(tid);
  if (!ctx.ok) {
    return { ok: false, error: ctx.error, requestJson };
  }

  const statusUrl = ctx.endpoints.fx4CashStatusReportUrl.trim();
  if (!statusUrl) {
    return {
      ok: false,
      error: "FX4Cash Status-Report-URL ist nicht konfiguriert.",
      requestJson,
    };
  }

  const correlationId = createFx4CashCorrelationId();
  const extraHeaders = {
    "x-customer-identifier": ctx.creds.xCustomerIdentifier,
    "x-correlation-identifier": correlationId,
    "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
  };

  try {
    const res = await cbConnectSignedPostResult(
      ctx.creds,
      statusUrl,
      ctx.accessToken,
      requestJson,
      extraHeaders
    );

    const responseJson = formatProbeResponseJson(res.body);
    const parsed = parseFx4CashStatusReportResponse(res.body);
    const okHttp = res.status >= 200 && res.status < 300;

    if (!okHttp) {
      return {
        ok: false,
        error: `FX4Cash Status-Enquiry: HTTP ${res.status}`,
        status: res.status,
        correlationId,
        responseJson,
        requestJson,
      };
    }

    return {
      ok: true,
      status: res.status,
      correlationId,
      responseJson,
      requestJson,
      transactionStatus: parsed.transactionStatus,
      serviceRequestId: parsed.serviceRequestId,
      summary: parsed.summary,
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "FX4Cash Status-Enquiry fehlgeschlagen.",
      correlationId,
      requestJson,
    };
  }
}

export async function cbConnectFx4CashStatusReportProbe(
  teamId: string,
  _statusReportUrl: string,
  _oauthTokenUrl: string,
  input: Fx4CashStatusReportInput
): Promise<
  | {
      ok: true;
      status: number;
      message: string;
      requestJson: string;
      responseJson: string;
      requestHeadersJson?: string;
    }
  | {
      ok: false;
      error: string;
      requestJson?: string;
      responseJson?: string;
      requestHeadersJson?: string;
    }
> {
  const result = await cbConnectFx4CashStatusReport(teamId, input);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      requestJson: result.requestJson,
      responseJson: result.responseJson,
    };
  }

  const msg = result.summary
    ? `Status-Enquiry OK (HTTP ${result.status}): ${result.summary}`
    : `Status-Enquiry OK (HTTP ${result.status}, Correlation: ${result.correlationId})`;

  return {
    ok: true,
    status: result.status,
    message: msg,
    requestJson: result.requestJson,
    responseJson: result.responseJson,
    requestHeadersJson: undefined,
  };
}

export async function cbConnectFx4CashProbe(
  teamId: string,
  initiationUrl: string,
  oauthTokenUrl: string,
  params?: Partial<Fx4CashInitiationParams>
): Promise<
  | {
      ok: true;
      status: number;
      message: string;
      requestJson: string;
      responseJson: string;
      requestHeadersJson?: string;
      correlationId?: string;
      endToEndIdentification?: string;
    }
  | {
      ok: false;
      error: string;
      requestJson?: string;
      responseJson?: string;
      requestHeadersJson?: string;
      correlationId?: string;
      endToEndIdentification?: string;
    }
> {
  const prepared = prepareFx4CashInitiationRequest(params);
  const { requestJson, correlationId, endToEndIdentification } = prepared;
  const url = initiationUrl.trim() || (await cbConnectEndpointsGetPublic(teamId)).fx4CashInitiationUrl;

  const creds = await nativeBankGetResolvedCredentials(teamId);
  const bankingErr = validateCredentialsForBankingApi(creds);
  if (bankingErr) {
    return {
      ok: false,
      error: bankingErr,
      requestJson,
      correlationId,
      endToEndIdentification,
    };
  }

  try {
    const { accessToken } = await cbConnectFetchAccessToken(
      creds,
      oauthTokenUrl.trim() || (await cbConnectEndpointsGetPublic(teamId)).oauthTokenUrl
    );
    const extraHeaders = {
      "x-customer-identifier": creds.xCustomerIdentifier,
      "x-correlation-identifier": correlationId,
      "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
    };

    const res = await cbConnectSignedPostResult(
      creds,
      url,
      accessToken,
      requestJson,
      extraHeaders
    );

    const responseJson = formatProbeResponseJson(res.body);
    const requestHeadersJson = formatProbeRequestHeaders(res.requestHeaders);
    const okHttp = res.status >= 200 && res.status < 300;

    if (!okHttp) {
      return {
        ok: false,
        error: `FX4Cash (positiver Fall): HTTP ${res.status}`,
        requestJson,
        responseJson,
        requestHeadersJson,
        correlationId,
        endToEndIdentification,
      };
    }

    return {
      ok: true,
      status: res.status,
      message: `FX4Cash Initiierung erfolgreich (HTTP ${res.status}, E2E: ${endToEndIdentification}, Correlation: ${correlationId})`,
      requestJson,
      responseJson,
      requestHeadersJson,
      correlationId,
      endToEndIdentification,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "FX4Cash-Test fehlgeschlagen.",
      requestJson,
      correlationId,
      endToEndIdentification,
    };
  }
}

function evaluateFx4CashValueDateProbeOutcome(
  scenario: Fx4CashValueDateScenario,
  status: number,
  body: string
): { ok: boolean; message: string } {
  const meta = FX4CASH_VALUE_DATE_PROBE_SCENARIOS.find((s) => s.id === scenario);
  const label = meta?.label ?? scenario;
  const accepted = parseFx4CashValueDateAccepted(body);

  if (scenario === "notFound") {
    if (status === 404) {
      return {
        ok: true,
        message: `Evaluate (${label}): HTTP 404 wie erwartet`,
      };
    }
    return {
      ok: false,
      message: `Evaluate (${label}): erwartet HTTP 404, erhalten ${status}`,
    };
  }

  if (scenario === "dateRejected") {
    if (status === 404) {
      return {
        ok: false,
        message: `Evaluate (${label}): unerwartet HTTP 404`,
      };
    }
    if (accepted === false) {
      return {
        ok: true,
        message: `Evaluate (${label}): Valuta abgelehnt (HTTP ${status})`,
      };
    }
    if (accepted === true) {
      return {
        ok: false,
        message: `Evaluate (${label}): erwartet Ablehnung, Antwort zeigt Annahme`,
      };
    }
    if (status >= 200 && status < 300) {
      return {
        ok: true,
        message: `Evaluate (${label}): HTTP ${status} — Antwort prüfen (kein Annahme-Flag)`,
      };
    }
    return {
      ok: true,
      message: `Evaluate (${label}): HTTP ${status}`,
    };
  }

  if (status >= 200 && status < 300) {
    if (accepted === false) {
      return {
        ok: false,
        message: `Evaluate (${label}): erwartet Annahme, Valuta abgelehnt`,
      };
    }
    return {
      ok: true,
      message: `Evaluate (${label}): Valuta bestätigt (HTTP ${status})`,
    };
  }

  return {
    ok: false,
    message: `Evaluate (${label}): erwartet HTTP 2xx, erhalten ${status}`,
  };
}

export type Fx4CashValueDateEvaluateResult =
  | {
      ok: true;
      status: number;
      correlationId: string;
      accepted?: boolean;
      creditDate?: string;
      message: string;
      requestJson: string;
      responseJson: string;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      correlationId?: string;
      requestJson?: string;
      responseJson?: string;
    };

function formatValueDateEvaluateMessage(
  status: number,
  accepted: boolean | undefined,
  creditDate: string | undefined,
  suggestedValueDate: string
): string {
  if (status === 404) {
    return "Währungspaar oder Konto für Evaluate nicht gefunden (HTTP 404).";
  }
  if (status < 200 || status >= 300) {
    return `Evaluate fehlgeschlagen (HTTP ${status}).`;
  }
  if (accepted === false) {
    return "Valutadatum vom Bankensystem nicht akzeptiert.";
  }
  const date = creditDate ?? suggestedValueDate;
  if (accepted === true || creditDate) {
    return `Gutschrift voraussichtlich am ${date}.`;
  }
  return "Evaluate erfolgreich — Gutschriftstag in der Antwort prüfen.";
}

export async function cbConnectFx4CashEvaluateValueDate(
  teamId: string,
  params: Fx4CashValueDateParams
): Promise<Fx4CashValueDateEvaluateResult> {
  const tid = teamId?.trim();
  if (!tid) return { ok: false, error: "Team-ID fehlt." };

  const accountNumber = params.accountNumber?.trim();
  const currencyPair = params.currencyPair?.trim().toUpperCase();
  const suggestedValueDate = params.suggestedValueDate?.trim();
  if (!accountNumber || !currencyPair || !suggestedValueDate) {
    return {
      ok: false,
      error:
        "Abbuchungskonto, Währungspaar und Valutadatum sind für Evaluate erforderlich.",
    };
  }

  const normalized: Fx4CashValueDateParams = {
    accountNumber,
    currencyPair,
    suggestedValueDate,
  };
  const requestJson = formatFx4CashValueDateJson(normalized);

  const ctx = await resolveFx4CashBanking(tid);
  if (!ctx.ok) {
    return { ok: false, error: ctx.error, requestJson };
  }

  const url = ctx.endpoints.fx4CashValueDateUrl;
  const correlationId = createFx4CashCorrelationId();

  try {
    const res = await cbConnectSignedPostResult(
      ctx.creds,
      url,
      ctx.accessToken,
      requestJson,
      {
        "x-customer-identifier": ctx.creds.xCustomerIdentifier,
        "x-correlation-identifier": correlationId,
        "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
      }
    );

    const responseJson = formatProbeResponseJson(res.body);
    const parsed = parseFx4CashValueDateResponse(res.body);
    const message = formatValueDateEvaluateMessage(
      res.status,
      parsed.accepted,
      parsed.creditDate,
      suggestedValueDate
    );

    if (res.status === 404 || res.status < 200 || res.status >= 300) {
      return {
        ok: false,
        error: message,
        status: res.status,
        correlationId,
        requestJson,
        responseJson,
      };
    }

    if (parsed.accepted === false) {
      return {
        ok: false,
        error: message,
        status: res.status,
        correlationId,
        requestJson,
        responseJson,
      };
    }

    return {
      ok: true,
      status: res.status,
      correlationId,
      accepted: parsed.accepted,
      creditDate: parsed.creditDate ?? suggestedValueDate,
      message,
      requestJson,
      responseJson,
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "FX4Cash Evaluate fehlgeschlagen.",
      requestJson,
      correlationId,
    };
  }
}

export async function cbConnectFx4CashValueDateProbe(
  teamId: string,
  valueDateUrl: string,
  oauthTokenUrl: string,
  scenario: Fx4CashValueDateScenario,
  overrides?: Partial<Fx4CashValueDateParams>
): Promise<
  | {
      ok: true;
      status: number;
      message: string;
      requestJson: string;
      responseJson: string;
      requestHeadersJson?: string;
    }
  | {
      ok: false;
      error: string;
      requestJson?: string;
      responseJson?: string;
      requestHeadersJson?: string;
    }
> {
  const params: Fx4CashValueDateParams = {
    ...defaultFx4CashValueDateParams(scenario),
    ...(overrides ?? {}),
  };
  const requestJson = formatFx4CashValueDateJson(params);
  const url =
    valueDateUrl.trim() ||
    (await cbConnectEndpointsGetPublic(teamId)).fx4CashValueDateUrl;

  const creds = await nativeBankGetResolvedCredentials(teamId);
  const bankingErr = validateCredentialsForBankingApi(creds);
  if (bankingErr) {
    return { ok: false, error: bankingErr, requestJson };
  }

  try {
    const { accessToken } = await cbConnectFetchAccessToken(
      creds,
      oauthTokenUrl.trim() || (await cbConnectEndpointsGetPublic(teamId)).oauthTokenUrl
    );
    const correlationId = createFx4CashCorrelationId();
    const extraHeaders = {
      "x-customer-identifier": creds.xCustomerIdentifier,
      "x-correlation-identifier": correlationId,
      "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
    };

    const res = await cbConnectSignedPostResult(
      creds,
      url,
      accessToken,
      requestJson,
      extraHeaders
    );

    const responseJson = formatProbeResponseJson(res.body);
    const requestHeadersJson = formatProbeRequestHeaders(res.requestHeaders);
    const outcome = evaluateFx4CashValueDateProbeOutcome(
      scenario,
      res.status,
      res.body
    );

    if (!outcome.ok) {
      return {
        ok: false,
        error: outcome.message,
        requestJson,
        responseJson,
        requestHeadersJson,
      };
    }

    return {
      ok: true,
      status: res.status,
      message: `${outcome.message} (Correlation: ${correlationId})`,
      requestJson,
      responseJson,
      requestHeadersJson,
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "FX4Cash Evaluate-Test fehlgeschlagen.",
      requestJson,
    };
  }
}
