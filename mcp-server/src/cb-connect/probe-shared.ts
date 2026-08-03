export type CbConnectProbeKind =
  | "token"
  | "accountHealth"
  | "accountBalance"
  | "instantPaymentHealth"
  | "statementRequest"
  | "statementLoad"
  | "swiftTracker"
  | "fx4CashInitiation"
  | "fx4CashStatusReport"
  | "fx4CashValueDateEvaluate";

import type { CbConnectStatementType } from "./cb-connect-statements-parse.js";
import type { Fx4CashStatusReportInput } from "./cb-connect-fx4cash-parse.js";
import type { Fx4CashInitiationParams } from "./cb-connect-fx4cash-shared.js";
import type {
  Fx4CashValueDateParams,
  Fx4CashValueDateScenario,
} from "./cb-connect-fx4cash-value-date-shared.js";
import type {
  SwiftTrackerProbeParams,
  SwiftTrackerProbeScenario,
} from "./cb-connect-swift-tracker-probe-shared.js";

export type CbConnectProbeInput = {
  oauthTokenUrl?: string;
  accountBalanceHealthUrl?: string;
  accountBalanceUrl?: string;
  branchIdentifier?: string;
  accountCurrency?: string;
  accountIdentifier?: string;
  instantPaymentHealthUrl?: string;
  statementsRequestUrl?: string;
  statementsLoadUrl?: string;
  statementsVersion?: string;
  serviceRequestId?: string;
  fromDate?: string;
  toDate?: string;
  statementType?: CbConnectStatementType;
  swiftG4cUrl?: string;
  swiftTrackerScenario?: SwiftTrackerProbeScenario;
  clientBic?: string;
  serviceLevel?: string;
  uetr?: string;
  next?: string;
  startDateTime?: string;
  endDateTime?: string;
  creditorAccount?: string;
  maximumNumber?: string;
  swiftTrackerParams?: Partial<SwiftTrackerProbeParams>;
  fx4CashInitiationUrl?: string;
  fx4CashStatusReportUrl?: string;
  fx4CashParams?: Partial<Fx4CashInitiationParams>;
  fx4CashStatusReport?: Partial<Fx4CashStatusReportInput>;
  fx4CashValueDateUrl?: string;
  fx4CashValueDateScenario?: Fx4CashValueDateScenario;
  fx4CashValueDateParams?: Partial<Fx4CashValueDateParams>;
};

export type CbConnectProbeResult =
  | {
      ok: true;
      status: number;
      message: string;
      responseJson?: string;
      requestJson?: string;
      requestHeadersJson?: string;
      serviceRequestId?: string;
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
    };
