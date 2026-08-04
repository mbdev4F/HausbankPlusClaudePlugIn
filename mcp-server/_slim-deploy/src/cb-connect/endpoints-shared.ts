/**
 * Deutsche Bank CB-Connect API — Endpunkt-URLs (Client-Formular).
 */

import { CB_CONNECT_SANDBOX_DEFAULTS } from "./cb-connect-sandbox-defaults";

/** V2 = produktiv; V8 = Beta */
export type StatementsApiVersion = "V2" | "V8" | "";

export const STATEMENTS_VERSION_LABELS: Record<
  Exclude<StatementsApiVersion, "">,
  string
> = {
  V2: "V2",
  V8: "V8 (Beta)",
};

export type CbConnectEndpoints = {
  accountBalanceUrl: string;
  accountBalanceHealthUrl: string;
  swiftG4cUrl: string;
  /** OAuth2 Client-Credentials Token (CIDP). */
  oauthTokenUrl: string;
  instantPaymentInitiationUrl: string;
  instantPaymentStatusUrl: string;
  instantPaymentHealthUrl: string;
  verificationOfPayeeUrl: string;
  /** Account Pre-Validation (Zahlungsempfänger vor Freigabe prüfen). */
  accountPreValidationUrl: string;
  /** FX for Cash — grenzüberschreitende Fremdwährungszahlung (pain.001). */
  fx4CashInitiationUrl: string;
  /** FX for Cash — Status-Enquiry (status-report). */
  fx4CashStatusReportUrl: string;
  /** FX for Cash — Evaluate Valutadatum vor Initiierung (valueDate). */
  fx4CashValueDateUrl: string;
  statementsRequestUrl: string;
  statementsLoadUrl: string;
  statementsVersion: StatementsApiVersion;
};

export type CbConnectEndpointsSource = "none" | "stored" | "defaults" | "mixed";

export type CbConnectEndpointsPublic = CbConnectEndpoints & {
  updatedAt: number | null;
  /** Mindestens ein Feld aus UI-Speicher. */
  hasStoredEndpoints: boolean;
  source: CbConnectEndpointsSource;
};

export { CB_CONNECT_SANDBOX_DEFAULTS };

export function emptyCbConnectEndpoints(): CbConnectEndpoints {
  return { ...CB_CONNECT_SANDBOX_DEFAULTS };
}

export type CbConnectEndpointsSaveResult =
  | { ok: true; endpoints: CbConnectEndpointsPublic }
  | { ok: false; error: string };
