/** finAPI Access + Web Form 2.0 — connector types (ported from dbHealthflow). */

export type FinapiEnvironment = "sandbox" | "live";

export type FinapiEndpoints = {
  accessBaseUrl: string;
  webFormBaseUrl: string;
};

export type FinapiBankConnectionSummary = {
  id: number;
  name: string;
  bankName: string | null;
  updatedAt: number;
};

export type FinapiAccountSummary = {
  id: number;
  name: string;
  label?: string;
  iban: string | null;
  accountType: string | null;
  balance: number | null;
  currency: string | null;
  bankConnectionId: number | null;
  syncedAt: number;
};

export type FinapiTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
};

export type FinapiCreateUserResponse = {
  id: string;
  password: string;
  email?: string;
  phone?: string;
};

export type FinapiWebFormResponse = {
  id: string;
  url: string;
  status?: string;
  type?: string;
};

export const FINAPI_SANDBOX_ENDPOINTS: FinapiEndpoints = {
  accessBaseUrl: "https://sandbox.finapi.io",
  webFormBaseUrl: "https://webform-sandbox.finapi.io",
};

export const FINAPI_LIVE_ENDPOINTS: FinapiEndpoints = {
  accessBaseUrl: "https://live.finapi.io",
  webFormBaseUrl: "https://webform-live.finapi.io",
};

export const FINAPI_DEFAULT_ACCOUNT_TYPES = [
  "CHECKING",
  "SAVINGS",
  "CREDIT_CARD",
] as const;

export function finapiEndpointsForEnvironment(
  env: FinapiEnvironment
): FinapiEndpoints {
  return env === "live" ? FINAPI_LIVE_ENDPOINTS : FINAPI_SANDBOX_ENDPOINTS;
}

export function finapiAccountDisplayName(
  row: Pick<FinapiAccountSummary, "label" | "name" | "id">
): string {
  const label = (row.label ?? "").trim();
  if (label) return label;
  const name = (row.name ?? "").trim();
  return name || `Konto ${row.id}`;
}
