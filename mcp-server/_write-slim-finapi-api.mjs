import fs from "node:fs";

const apiClient = `import type {
  FinapiCreateUserResponse,
  FinapiEndpoints,
  FinapiTokenResponse,
  FinapiWebFormResponse,
} from "./shared";

export class FinapiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string
  ) {
    super(message);
    this.name = "FinapiApiError";
  }

  detailMessage(): string {
    try {
      const parsed = JSON.parse(this.body) as {
        errors?: Array<{ field?: string; message?: string }>;
        description?: string;
        code?: string;
      };
      if (parsed.errors?.length) {
        return parsed.errors
          .map((e) => [e.field, e.message].filter(Boolean).join(": "))
          .join("; ");
      }
      if (parsed.description) return parsed.description;
      if (parsed.code) return parsed.code;
    } catch {
      /* ignore */
    }
    return this.body.trim().slice(0, 240);
  }
}

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

async function readErrorBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}

export async function finapiGetClientToken(
  endpoints: FinapiEndpoints,
  clientId: string,
  clientSecret: string
): Promise<FinapiTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(\`\${endpoints.accessBaseUrl}/api/v2/oauth/token\`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new FinapiApiError(
      \`finAPI Client-Token fehlgeschlagen (HTTP \${res.status})\`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as FinapiTokenResponse;
}

export async function finapiGetUserToken(
  endpoints: FinapiEndpoints,
  clientId: string,
  clientSecret: string,
  username: string,
  password: string
): Promise<FinapiTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
  });

  const res = await fetch(\`\${endpoints.accessBaseUrl}/api/v2/oauth/token\`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new FinapiApiError(
      \`finAPI User-Token fehlgeschlagen (HTTP \${res.status})\`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as FinapiTokenResponse;
}

export async function finapiCreateUser(
  endpoints: FinapiEndpoints,
  clientToken: string,
  userId?: string
): Promise<FinapiCreateUserResponse> {
  const res = await fetch(\`\${endpoints.accessBaseUrl}/api/v2/users\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${clientToken}\`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(userId ? { id: userId } : {}),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new FinapiApiError(
      \`finAPI User anlegen fehlgeschlagen (HTTP \${res.status})\`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as FinapiCreateUserResponse;
}

export async function finapiCreateBankConnectionWebForm(
  endpoints: FinapiEndpoints,
  userToken: string,
  params: {
    callbackUrl?: string;
    accountTypes?: readonly string[];
  }
): Promise<FinapiWebFormResponse> {
  const payload: Record<string, unknown> = {
    accountTypes: params.accountTypes ?? ["CHECKING", "SAVINGS"],
  };

  const callbackUrl = params.callbackUrl?.trim();
  if (callbackUrl && isHttpsUrl(callbackUrl)) {
    payload.callbacks = { finalised: callbackUrl };
  }

  const res = await fetch(
    \`\${endpoints.webFormBaseUrl}/api/webForms/bankConnectionImport\`,
    {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${userToken}\`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new FinapiApiError(
      \`finAPI Web Form fehlgeschlagen (HTTP \${res.status})\`,
      res.status,
      body
    );
  }

  return (await res.json()) as FinapiWebFormResponse;
}

export async function finapiGetWebForm(
  endpoints: FinapiEndpoints,
  userToken: string,
  webFormId: string
): Promise<Record<string, unknown>> {
  const res = await fetch(
    \`\${endpoints.webFormBaseUrl}/api/webForms/\${encodeURIComponent(webFormId)}\`,
    {
      headers: {
        Authorization: \`Bearer \${userToken}\`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    throw new FinapiApiError(
      \`finAPI Web-Form-Status fehlgeschlagen (HTTP \${res.status})\`,
      res.status,
      await readErrorBody(res)
    );
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function finapiFetchAccounts(
  endpoints: FinapiEndpoints,
  userToken: string,
  options?: { bankConnectionIds?: number[] }
): Promise<unknown> {
  const q = new URLSearchParams();
  const connectionIds = (options?.bankConnectionIds ?? []).filter((id) =>
    Number.isFinite(id)
  );
  if (connectionIds.length > 0) {
    q.set("bankConnectionIds", connectionIds.join(","));
  }
  const suffix = q.toString() ? \`?\${q.toString()}\` : "";
  const res = await fetch(
    \`\${endpoints.accessBaseUrl}/api/v2/accounts\${suffix}\`,
    {
      headers: {
        Authorization: \`Bearer \${userToken}\`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    throw new FinapiApiError(
      \`finAPI Konten abrufen fehlgeschlagen (HTTP \${res.status})\`,
      res.status,
      await readErrorBody(res)
    );
  }

  return res.json();
}

export async function finapiFetchBankConnections(
  endpoints: FinapiEndpoints,
  userToken: string
): Promise<unknown> {
  const res = await fetch(
    \`\${endpoints.accessBaseUrl}/api/v2/bankConnections\`,
    {
      headers: {
        Authorization: \`Bearer \${userToken}\`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    throw new FinapiApiError(
      \`finAPI Bankverbindungen abrufen fehlgeschlagen (HTTP \${res.status})\`,
      res.status,
      await readErrorBody(res)
    );
  }

  return res.json();
}
`;

const ops = `/**
 * Thin MCP-facing operations over finAPI connectors (deploy slim).
 */
import {
  FinapiApiError,
  finapiCreateBankConnectionWebForm,
  finapiCreateUser,
  finapiFetchAccounts,
  finapiFetchBankConnections,
  finapiGetClientToken,
  finapiGetUserToken,
  finapiGetWebForm,
} from "./finapi/api-client";
import {
  parseFinapiAccounts,
  parseFinapiBankConnections,
} from "./finapi/accounts-parse";
import { hasFinapiEnv, readFinapiEnv } from "./finapi/env-config";
import {
  finapiGetResolvedCredentials,
  validateFinapiClientCredentials,
  validateFinapiUserCredentials,
} from "./finapi/resolved-credentials";
import {
  FINAPI_DEFAULT_ACCOUNT_TYPES,
  finapiAccountDisplayName,
} from "./finapi/shared";
import {
  finapiBankConnectionIdFromWebForm,
  finapiPaymentIdFromWebForm,
  isFinapiWebFormFinalStatus,
} from "./finapi/finapi-webform-payload";

async function clientSession() {
  const creds = finapiGetResolvedCredentials();
  const err = validateFinapiClientCredentials(creds);
  if (err) throw new Error(err);
  const token = await finapiGetClientToken(
    creds.endpoints,
    creds.clientId,
    creds.clientSecret
  );
  return { creds, clientToken: token.access_token, expiresIn: token.expires_in };
}

async function userSession() {
  const creds = finapiGetResolvedCredentials();
  const err = validateFinapiUserCredentials(creds);
  if (err) throw new Error(err);
  const token = await finapiGetUserToken(
    creds.endpoints,
    creds.clientId,
    creds.clientSecret,
    creds.userId,
    creds.userPassword
  );
  return { creds, userToken: token.access_token, expiresIn: token.expires_in };
}

export async function finapiProbeAuth() {
  const env = readFinapiEnv();
  const creds = finapiGetResolvedCredentials();
  const clientErr = validateFinapiClientCredentials(creds);
  const userErr = validateFinapiUserCredentials(creds);

  let clientTokenOk = false;
  let clientTokenError: string | null = null;
  let userTokenOk = false;
  let userTokenError: string | null = null;

  if (!clientErr) {
    try {
      await finapiGetClientToken(
        creds.endpoints,
        creds.clientId,
        creds.clientSecret
      );
      clientTokenOk = true;
    } catch (e) {
      clientTokenError =
        e instanceof FinapiApiError
          ? \`\${e.message}: \${e.detailMessage()}\`
          : e instanceof Error
            ? e.message
            : String(e);
    }
  }

  if (!userErr && clientTokenOk) {
    try {
      await finapiGetUserToken(
        creds.endpoints,
        creds.clientId,
        creds.clientSecret,
        creds.userId,
        creds.userPassword
      );
      userTokenOk = true;
    } catch (e) {
      userTokenError =
        e instanceof FinapiApiError
          ? \`\${e.message}: \${e.detailMessage()}\`
          : e instanceof Error
            ? e.message
            : String(e);
    }
  }

  return {
    ok: clientTokenOk,
    hasEnvCredentials: hasFinapiEnv(),
    environment: env.environment,
    accessBaseUrl: env.endpoints.accessBaseUrl,
    webFormBaseUrl: env.endpoints.webFormBaseUrl,
    clientIdPresent: Boolean(env.clientId),
    clientSecretPresent: Boolean(env.clientSecret),
    userIdPresent: Boolean(env.userId),
    userPasswordPresent: Boolean(env.userPassword),
    publicOrigin: env.publicOrigin,
    clientValidationError: clientErr,
    userValidationError: userErr,
    clientTokenOk,
    clientTokenError,
    userTokenOk,
    userTokenError,
  };
}

export async function finapiProvisionUser(preferredUserId?: string) {
  const { creds, clientToken } = await clientSession();
  if (creds.userId && creds.userPassword) {
    return {
      ok: true,
      alreadyConfigured: true,
      userId: creds.userId,
      message:
        "FINAPI_USER_ID/PASSWORD bereits gesetzt — kein neuer User angelegt.",
    };
  }

  const preferred = preferredUserId?.trim() || undefined;
  let created;
  try {
    created = await finapiCreateUser(creds.endpoints, clientToken, preferred);
  } catch {
    created = await finapiCreateUser(creds.endpoints, clientToken);
  }

  return {
    ok: true,
    alreadyConfigured: false,
    userId: created.id,
    userPassword: created.password,
    message:
      "User angelegt. Bitte FINAPI_USER_ID und FINAPI_USER_PASSWORD in der Env speichern (Passwort wird vom MCP nicht persistiert).",
  };
}

export async function finapiListBankConnections() {
  const { creds, userToken } = await userSession();
  const raw = await finapiFetchBankConnections(creds.endpoints, userToken);
  return {
    ok: true,
    bankConnections: parseFinapiBankConnections(raw),
  };
}

export async function finapiListAccounts(options?: {
  bankConnectionIds?: number[];
}) {
  const { creds, userToken } = await userSession();
  const [connectionsRaw, accountsRaw] = await Promise.all([
    finapiFetchBankConnections(creds.endpoints, userToken),
    finapiFetchAccounts(creds.endpoints, userToken, {
      bankConnectionIds: options?.bankConnectionIds,
    }),
  ]);
  const accounts = parseFinapiAccounts(accountsRaw).map((a) => ({
    ...a,
    displayName: finapiAccountDisplayName(a),
  }));
  return {
    ok: true,
    bankConnections: parseFinapiBankConnections(connectionsRaw),
    accounts,
  };
}

export async function finapiStartBankConnection(args?: {
  callbackUrl?: string;
  accountTypes?: string[];
}) {
  const { creds, userToken } = await userSession();
  const callbackUrl =
    args?.callbackUrl?.trim() ||
    (creds.publicOrigin
      ? \`\${creds.publicOrigin}/api/finapi/webform/callback\`
      : undefined);
  const webForm = await finapiCreateBankConnectionWebForm(
    creds.endpoints,
    userToken,
    {
      callbackUrl,
      accountTypes: args?.accountTypes?.length
        ? args.accountTypes
        : [...FINAPI_DEFAULT_ACCOUNT_TYPES],
    }
  );
  return {
    ok: true,
    webFormId: webForm.id,
    webFormUrl: webForm.url,
    status: webForm.status,
    note: "Benutzer muss die Web-Form-URL im Browser öffnen und SCA abschließen.",
  };
}

export async function finapiGetWebformStatus(args: { webFormId: string }) {
  const { creds, userToken } = await userSession();
  const webForm = await finapiGetWebForm(
    creds.endpoints,
    userToken,
    args.webFormId
  );
  const status =
    typeof webForm.status === "string" ? webForm.status : undefined;
  return {
    ok: true,
    webForm,
    status,
    isFinal: status ? isFinapiWebFormFinalStatus(status) : false,
    paymentId: finapiPaymentIdFromWebForm(webForm),
    bankConnectionId: finapiBankConnectionIdFromWebForm(webForm),
  };
}
`;

fs.mkdirSync("mcp-server/_slim-deploy/src/finapi", { recursive: true });
fs.writeFileSync(
  "mcp-server/_slim-deploy/src/finapi/api-client.ts",
  apiClient
);
fs.writeFileSync("mcp-server/_slim-deploy/src/operations-finapi.ts", ops);
console.log(
  JSON.stringify({
    apiClient: Buffer.byteLength(apiClient),
    ops: Buffer.byteLength(ops),
  })
);
