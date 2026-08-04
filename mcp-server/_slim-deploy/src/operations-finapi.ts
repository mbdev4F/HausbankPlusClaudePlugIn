/**
 * Thin MCP-facing operations over HealthFlow finAPI connectors.
 * Credentials come from FINAPI_* env (no Next.js team store).
 */

import { randomUUID } from "node:crypto";
import {
  FinapiApiError,
  finapiCreateBankConnectionWebForm,
  finapiCreatePaymentWithAccountWebForm,
  finapiCreateStandalonePaymentWebForm,
  finapiCreateUser,
  finapiFetchAccountTransactions,
  finapiFetchAccounts,
  finapiFetchBankConnections,
  finapiGetClientToken,
  finapiGetPayments,
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
import { finapiAccountIdFromBankingAccountId } from "./finapi/finapi-account-id";
import {
  finapiBankConnectionIdFromWebForm,
  finapiPaymentIdFromWebForm,
  isFinapiWebFormFinalStatus,
} from "./finapi/finapi-webform-payload";
import {
  finapiAccessPaymentStatusLabel,
  mapFinapiAccessStatusToLocal,
} from "./finapi/finapi-payment-status";
import {
  sanitizeSepaEndToEndId,
  sanitizeSepaText,
} from "./finapi/payment-text";

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

function resolveAccountId(accountId: string | number): number {
  if (typeof accountId === "number") {
    if (!Number.isFinite(accountId) || accountId <= 0) {
      throw new Error("Ungültige finAPI accountId.");
    }
    return accountId;
  }
  const raw = accountId.trim();
  const fromPrefixed = finapiAccountIdFromBankingAccountId(raw);
  if (fromPrefixed != null) return fromPrefixed;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      "accountId muss eine finAPI-Nummer oder finapi:{id} sein."
    );
  }
  return n;
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
          ? `${e.message}: ${e.detailMessage()}`
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
          ? `${e.message}: ${e.detailMessage()}`
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

/**
 * Creates a finAPI Access user once. Returns id+password for the operator
 * to store as FINAPI_USER_ID / FINAPI_USER_PASSWORD (not persisted by the MCP).
 */
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
    created = await finapiCreateUser(
      creds.endpoints,
      clientToken,
      preferred
    );
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

export async function finapiListTransactions(args: {
  accountId: string | number;
  page?: number;
  perPage?: number;
}) {
  const { creds, userToken } = await userSession();
  const accountId = resolveAccountId(args.accountId);
  const raw = await finapiFetchAccountTransactions(
    creds.endpoints,
    userToken,
    accountId,
    { page: args.page, perPage: args.perPage }
  );
  return { ok: true, accountId, raw };
}

export async function finapiStartBankConnection(args?: {
  callbackUrl?: string;
  accountTypes?: string[];
}) {
  const { creds, userToken } = await userSession();
  const callbackUrl =
    args?.callbackUrl?.trim() ||
    (creds.publicOrigin
      ? `${creds.publicOrigin}/api/finapi/webform/callback`
      : undefined);
  const webForm = await finapiCreateBankConnectionWebForm(
    creds.endpoints,
    userToken,
    {
      callbackUrl,
      accountTypes:
        args?.accountTypes?.length
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

export async function finapiInitiateSepaPayment(args: {
  accountId: string | number;
  recipientName: string;
  recipientIban: string;
  recipientBic?: string;
  amount: number;
  currency?: string;
  purpose?: string;
  endToEndId?: string;
  senderName?: string;
  executionDate?: string;
  instantPayment?: boolean;
  verifyPayees?: boolean;
  redirectUrl?: string;
  callbackUrl?: string;
}) {
  const { creds, userToken } = await userSession();
  const accountId = resolveAccountId(args.accountId);
  const purpose = sanitizeSepaText(args.purpose ?? "Zahlung", 140);
  const endToEndId = sanitizeSepaEndToEndId(
    args.endToEndId ?? randomUUID().replace(/-/g, "").slice(0, 35)
  );
  const callbackUrl =
    args.callbackUrl?.trim() ||
    (creds.publicOrigin
      ? `${creds.publicOrigin}/api/finapi/webform/callback`
      : undefined);
  const redirectUrl =
    args.redirectUrl?.trim() || creds.publicOrigin || undefined;

  const webForm = await finapiCreatePaymentWithAccountWebForm(
    creds.endpoints,
    userToken,
    {
      accountId,
      senderName: args.senderName,
      orders: [
        {
          recipient: {
            name: sanitizeSepaText(args.recipientName, 70),
            iban: args.recipientIban.replace(/\s/g, ""),
            bic: args.recipientBic,
          },
          amount: {
            value: args.amount,
            currency: (args.currency ?? "EUR").toUpperCase(),
          },
          purpose,
          endToEndId,
        },
      ],
      executionDate: args.executionDate,
      instantPayment: args.instantPayment ?? false,
      verifyPayees: args.verifyPayees,
      redirectUrl,
      callbackUrl,
    },
    randomUUID()
  );

  return {
    ok: true,
    webFormId: webForm.id,
    webFormUrl: webForm.url,
    status: webForm.status,
    endToEndId,
    note: "Benutzer muss die Web-Form-URL im Browser öffnen und die Zahlung freigeben (SCA).",
  };
}

export async function finapiInitiateStandalonePayment(args: {
  recipientName: string;
  recipientIban: string;
  recipientBic?: string;
  amount: number;
  currency?: string;
  purpose?: string;
  endToEndId?: string;
  senderIban?: string;
  executionDate?: string;
  instantPayment?: boolean;
  redirectUrl?: string;
  callbackUrl?: string;
}) {
  const { creds, userToken } = await userSession();
  const purpose = sanitizeSepaText(args.purpose ?? "Zahlung", 140);
  const endToEndId = sanitizeSepaEndToEndId(
    args.endToEndId ?? randomUUID().replace(/-/g, "").slice(0, 35)
  );
  const callbackUrl =
    args.callbackUrl?.trim() ||
    (creds.publicOrigin
      ? `${creds.publicOrigin}/api/finapi/webform/callback`
      : undefined);
  const redirectUrl =
    args.redirectUrl?.trim() || creds.publicOrigin || undefined;

  const webForm = await finapiCreateStandalonePaymentWebForm(
    creds.endpoints,
    userToken,
    {
      orders: [
        {
          recipient: {
            name: sanitizeSepaText(args.recipientName, 70),
            iban: args.recipientIban.replace(/\s/g, ""),
            bic: args.recipientBic,
          },
          amount: {
            value: args.amount,
            currency: (args.currency ?? "EUR").toUpperCase(),
          },
          purpose,
          endToEndId,
        },
      ],
      executionDate: args.executionDate,
      instantPayment: args.instantPayment ?? false,
      sender: args.senderIban
        ? { iban: args.senderIban.replace(/\s/g, "") }
        : undefined,
      redirectUrl,
      callbackUrl,
    }
  );

  return {
    ok: true,
    webFormId: webForm.id,
    webFormUrl: webForm.url,
    status: webForm.status,
    endToEndId,
    note: "Standalone: Zahler wählt Bank/Konto in der Web Form und gibt per SCA frei.",
  };
}

export async function finapiGetPaymentStatus(args: {
  paymentIds: number[];
}) {
  const { creds, userToken } = await userSession();
  const payments = await finapiGetPayments(
    creds.endpoints,
    userToken,
    args.paymentIds
  );
  return {
    ok: true,
    payments: payments.map((p) => {
      const label = finapiAccessPaymentStatusLabel(p);
      const mapped = mapFinapiAccessStatusToLocal(label);
      return {
        ...p,
        statusLabel: label,
        localStatus: mapped.status,
        bankTransactionStatus: mapped.bankTransactionStatus,
      };
    }),
  };
}
