import { readBetterPaymentEnv } from "./env-config.js";

export type BetterPaymentResolvedCredentials = {
  apiKey: string;
  outgoingKey: string;
  incomingKey: string;
  apiBaseUrl: string;
  publicOrigin: string | null;
  environment: "sandbox" | "live";
};

export function betterPaymentGetResolvedCredentials(): BetterPaymentResolvedCredentials {
  const e = readBetterPaymentEnv();
  return {
    apiKey: e.apiKey,
    outgoingKey: e.outgoingKey,
    incomingKey: e.incomingKey,
    apiBaseUrl: e.apiBaseUrl,
    publicOrigin: e.publicOrigin,
    environment: e.environment,
  };
}

export function validateBetterPaymentCredentials(
  creds: BetterPaymentResolvedCredentials
): string | null {
  if (!creds.apiKey) return "BETTER_PAYMENT_API_KEY fehlt.";
  if (!creds.outgoingKey) return "BETTER_PAYMENT_OUTGOING_KEY fehlt.";
  if (!creds.apiBaseUrl) return "Better Payment API-Base-URL fehlt.";
  return null;
}
