import {
  basicAuthHeader,
  httpsRequest,
  mtlsRequest,
  truncateErrorBody,
} from "./cb-connect-http";
import {
  applyAccountBalanceUrlPlaceholders,
  createAccountBalanceCorrelationId,
  createStatementCorrelationId,
  formatCbConnectApiTimestamp,
} from "./cb-connect-signing-core";
import {
  createCbConnectSigner,
  formatCbConnectGmtDate,
  parseCbConnectHealthStatus,
} from "./cb-connect-signature";
import type { NativeBankResolvedCredentials } from "./resolved-credentials";

function pfxBuffer(creds: NativeBankResolvedCredentials): Buffer {
  return Buffer.from(creds.certificateBase64, "base64");
}

function mtlsOpts(creds: NativeBankResolvedCredentials) {
  return {
    pfx: pfxBuffer(creds),
    passphrase: creds.certificatePassword,
  };
}

/** Wie BC GetAccessToken — POST ohne mTLS, nur Basic Auth. */
export async function cbConnectFetchAccessToken(
  creds: NativeBankResolvedCredentials,
  tokenUrl: string
): Promise<{ accessToken: string; expiresInSec?: number }> {
  const url = tokenUrl.trim();
  if (!url) throw new Error("Token-URL fehlt.");

  const res = await httpsRequest({
    url,
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(creds.clientId, creds.clientSecret),
      Accept: "application/json",
    },
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `Token-Anfrage fehlgeschlagen (HTTP ${res.status}): ${truncateErrorBody(res.body)}`
    );
  }

  let json: { access_token?: string; expires_in?: number; error?: string };
  try {
    json = JSON.parse(res.body) as typeof json;
  } catch {
    throw new Error("Token-Antwort ist kein gültiges JSON.");
  }

  if (!json.access_token) {
    const err =
      typeof json.error === "string" && json.error
        ? json.error
        : truncateErrorBody(res.body) || "access_token fehlt";
    throw new Error(err);
  }

  return {
    accessToken: json.access_token,
    expiresInSec:
      typeof json.expires_in === "number" ? json.expires_in : undefined,
  };
}

/**
 * Signierter GET (wie BC GetHealth / DownlaodCertificate):
 * Date, Signature, Bearer, optional keyId — plus mTLS.
 */
export async function cbConnectSignedGet(
  creds: NativeBankResolvedCredentials,
  url: string,
  accessToken: string,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; body: string }> {
  const target = url.trim();
  if (!target) throw new Error("URL fehlt.");

  const dateHeader = formatCbConnectGmtDate();
  const signer = createCbConnectSigner(
    pfxBuffer(creds),
    creds.certificatePassword
  );
  const { signatureHeader } = signer.signGet(
    target,
    dateHeader,
    creds.keyId
  );

  const headers: Record<string, string> = {
    Date: dateHeader,
    Signature: signatureHeader,
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    ...extraHeaders,
  };

  if (creds.keyId.trim()) {
    headers.keyId = creds.keyId.trim();
  }

  const res = await mtlsRequest({
    url: target,
    method: "GET",
    headers,
    ...mtlsOpts(creds),
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `API-Anfrage fehlgeschlagen (HTTP ${res.status}): ${truncateErrorBody(res.body)}`
    );
  }

  return { status: res.status, body: res.body };
}

/** Signierter GET — liefert Status/Body auch bei HTTP-Fehlern (für Statement-Polling). */
export async function cbConnectSignedGetResult(
  creds: NativeBankResolvedCredentials,
  url: string,
  accessToken: string,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; body: string }> {
  const target = url.trim();
  if (!target) throw new Error("URL fehlt.");

  const dateHeader = formatCbConnectGmtDate();
  const signer = createCbConnectSigner(
    pfxBuffer(creds),
    creds.certificatePassword
  );
  const { signatureHeader } = signer.signGet(
    target,
    dateHeader,
    creds.keyId
  );

  const headers: Record<string, string> = {
    Date: dateHeader,
    Signature: signatureHeader,
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    ...extraHeaders,
  };

  if (creds.keyId.trim()) {
    headers.keyId = creds.keyId.trim();
  }

  const res = await mtlsRequest({
    url: target,
    method: "GET",
    headers,
    ...mtlsOpts(creds),
  });

  return { status: res.status, body: res.body };
}

/** Health-Check wie BC GetHealth — status muss „UP“ sein. */
export async function cbConnectGetHealth(
  creds: NativeBankResolvedCredentials,
  healthUrl: string,
  accessToken: string
): Promise<{ status: number; body: string; healthStatus: string }> {
  const result = await cbConnectSignedGet(creds, healthUrl, accessToken);
  const healthStatus = parseCbConnectHealthStatus(result.body);

  if (healthStatus !== "UP") {
    throw new Error(
      healthStatus
        ? `Health-Status ist „${healthStatus}“, erwartet „UP“.`
        : `Health-Antwort enthält kein status=UP: ${truncateErrorBody(result.body)}`
    );
  }

  return { ...result, healthStatus };
}

/** Kontosaldo — signierter GET mit Query-Platzhaltern (%1–%3). */
export async function cbConnectFetchAccountBalance(
  creds: NativeBankResolvedCredentials,
  balanceUrlTemplate: string,
  accessToken: string,
  params: {
    branchIdentifier: string;
    accountCurrency: string;
    accountIdentifier: string;
  }
): Promise<{
  status: number;
  body: string;
  resolvedUrl: string;
  correlationId: string;
}> {
  const resolvedUrl = applyAccountBalanceUrlPlaceholders(
    balanceUrlTemplate.trim(),
    params.branchIdentifier,
    params.accountCurrency,
    params.accountIdentifier
  );

  const correlationId = createAccountBalanceCorrelationId();

  const result = await cbConnectSignedGet(creds, resolvedUrl, accessToken, {
    "x-customer-identifier": creds.xCustomerIdentifier,
    "x-correlation-identifier": correlationId,
    "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
  });

  return { ...result, resolvedUrl, correlationId };
}

function bankingRequestHeaders(
  creds: NativeBankResolvedCredentials,
  correlationId: string,
  extra?: Record<string, string>
): Record<string, string> {
  return {
    "x-customer-identifier": creds.xCustomerIdentifier,
    "x-correlation-identifier": correlationId,
    "x-apiConsumer-request-timestamp": formatCbConnectApiTimestamp(),
    ...extra,
  };
}

/** Kontoauszug anfordern — signierter POST auf Statements-Request-URL. */
export async function cbConnectRequestStatement(
  creds: NativeBankResolvedCredentials,
  requestUrl: string,
  accessToken: string,
  body: string,
  options?: { apiVersion?: string }
): Promise<{
  status: number;
  body: string;
  correlationId: string;
}> {
  const correlationId = createStatementCorrelationId();
  const version = (options?.apiVersion ?? "").trim();
  const extraHeaders = bankingRequestHeaders(creds, correlationId, {
    ...(version ? { "x-api-version": version } : {}),
  });

  const result = await cbConnectSignedPost(
    creds,
    requestUrl,
    accessToken,
    body,
    extraHeaders
  );

  return { ...result, correlationId };
}

/** Kontoauszug laden (CAMT) — signierter GET auf Statements-Load-URL. */
export async function cbConnectLoadStatement(
  creds: NativeBankResolvedCredentials,
  loadUrl: string,
  accessToken: string,
  options?: { apiVersion?: string; allowErrorStatus?: boolean }
): Promise<{
  status: number;
  body: string;
  correlationId: string;
}> {
  const correlationId = createStatementCorrelationId();
  const version = (options?.apiVersion ?? "").trim();
  const extraHeaders = bankingRequestHeaders(creds, correlationId, {
    Accept: "application/xml, application/json, text/plain, */*",
    ...(version ? { "x-api-version": version } : {}),
  });

  const result = options?.allowErrorStatus
    ? await cbConnectSignedGetResult(creds, loadUrl, accessToken, extraHeaders)
    : await cbConnectSignedGet(creds, loadUrl, accessToken, extraHeaders);

  return { ...result, correlationId };
}

/**
 * Signierter POST (für spätere Zertifikats-/Zahlungs-APIs).
 * Digest-Header wird gesetzt wie in BC CertificateSigning.
 */
export async function cbConnectSignedPost(
  creds: NativeBankResolvedCredentials,
  url: string,
  accessToken: string,
  body: string,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; body: string }> {
  const target = url.trim();
  if (!target) throw new Error("URL fehlt.");

  const dateHeader = formatCbConnectGmtDate();
  const signer = createCbConnectSigner(
    pfxBuffer(creds),
    creds.certificatePassword
  );
  const { signatureHeader, digestHeader } = signer.signPost(
    target,
    body,
    dateHeader,
    creds.keyId
  );

  const headers: Record<string, string> = {
    Date: dateHeader,
    Signature: signatureHeader,
    Digest: digestHeader,
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "Content-Length": String(Buffer.byteLength(body, "utf8")),
    ...extraHeaders,
  };

  if (creds.keyId.trim()) {
    headers.keyId = creds.keyId.trim();
  }

  const res = await mtlsRequest({
    url: target,
    method: "POST",
    headers,
    body,
    ...mtlsOpts(creds),
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `API-Anfrage fehlgeschlagen (HTTP ${res.status}): ${truncateErrorBody(res.body)}`
    );
  }

  return { status: res.status, body: res.body };
}

function buildCbConnectSignedPostHeaders(
  creds: NativeBankResolvedCredentials,
  url: string,
  accessToken: string | null,
  body: string,
  extraHeaders?: Record<string, string>,
  options?: { omitAuthorization?: boolean }
): Record<string, string> {
  const target = url.trim();
  const dateHeader = formatCbConnectGmtDate();
  const signer = createCbConnectSigner(
    pfxBuffer(creds),
    creds.certificatePassword
  );
  const { signatureHeader, digestHeader } = signer.signPost(
    target,
    body,
    dateHeader,
    creds.keyId
  );

  const headers: Record<string, string> = {
    Date: dateHeader,
    Signature: signatureHeader,
    Digest: digestHeader,
    Accept: "application/json",
    "Content-Type": "application/json",
    "Content-Length": String(Buffer.byteLength(body, "utf8")),
    ...extraHeaders,
  };

  if (!options?.omitAuthorization && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (creds.keyId.trim()) {
    headers.keyId = creds.keyId.trim();
  }

  return headers;
}

/** Signierter POST — liefert Status/Body auch bei HTTP-Fehlern (Probes). */
export async function cbConnectSignedPostResult(
  creds: NativeBankResolvedCredentials,
  url: string,
  accessToken: string | null,
  body: string,
  extraHeaders?: Record<string, string>,
  options?: { omitAuthorization?: boolean }
): Promise<{ status: number; body: string; requestHeaders: Record<string, string> }> {
  const target = url.trim();
  if (!target) throw new Error("URL fehlt.");

  const headers = buildCbConnectSignedPostHeaders(
    creds,
    target,
    accessToken,
    body,
    extraHeaders,
    options
  );

  const res = await mtlsRequest({
    url: target,
    method: "POST",
    headers,
    body,
    ...mtlsOpts(creds),
  });

  return { status: res.status, body: res.body, requestHeaders: headers };
}

export type CbConnectSwiftTrackerHeaderParams = {
  branchIdentifier: string;
  accountIdentifier: string;
  clientBic: string;
  correlationId: string;
};

/** SWIFT GPI / Tracker Status — signierter POST (CB-Connect-Standard + SWIFT-Header). */
export async function cbConnectSwiftTrackerStatusPost(
  creds: NativeBankResolvedCredentials,
  url: string,
  accessToken: string,
  body: string,
  headerParams: CbConnectSwiftTrackerHeaderParams,
  options?: { allowErrorStatus?: boolean }
): Promise<{
  status: number;
  body: string;
  correlationId: string;
  requestHeaders?: Record<string, string>;
}> {
  const extraHeaders = bankingRequestHeaders(
    creds,
    headerParams.correlationId,
    {
      branchIdentifier: headerParams.branchIdentifier.trim(),
      accountIdentifier: headerParams.accountIdentifier.trim(),
      clientBIC: headerParams.clientBic.trim(),
    }
  );

  if (options?.allowErrorStatus) {
    const res = await cbConnectSignedPostResult(
      creds,
      url,
      accessToken,
      body,
      extraHeaders
    );
    return { ...res, correlationId: headerParams.correlationId };
  }

  const res = await cbConnectSignedPost(creds, url, accessToken, body, extraHeaders);

  return { ...res, correlationId: headerParams.correlationId };
}
