export type CbConnectAccountPreValidationStatus =
  | "pending"
  | "completed"
  | "failed";

export type CbConnectAccountPreValidationRecord = {
  id: string;
  beneficiaryName: string;
  /** IBAN oder Kontonummer */
  accountNumber: string;
  /** Bankleitzahl / BIC (optional bei IBAN) */
  bankCode: string;
  status: CbConnectAccountPreValidationStatus;
  resultSummary: string | null;
  resultCode: string | null;
  matchScore: string | null;
  fraudIndicator: string | null;
  correlationId: string | null;
  batchId: string | null;
  requestResponseJson: string;
  error: string | null;
  createdAt: number;
  updatedAt: number;
};

export type CbConnectAccountPreValidationPublic = {
  requests: CbConnectAccountPreValidationRecord[];
  updatedAt: number;
};

export type CbConnectAccountPreValidationInput = {
  beneficiaryName: string;
  accountNumber: string;
  bankCode?: string;
};

export type CbConnectAccountPreValidationSubmitResult =
  | { ok: true; request: CbConnectAccountPreValidationRecord }
  | { ok: false; error: string };

export type CbConnectAccountPreValidationBulkResult =
  | {
      ok: true;
      batchId: string;
      requests: CbConnectAccountPreValidationRecord[];
      failedCount: number;
    }
  | { ok: false; error: string };
