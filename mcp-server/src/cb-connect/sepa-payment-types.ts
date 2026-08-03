/** Minimal payment-check types (from HealthFlow SEPA UI, without Next app deps). */

export type CheckStatus = "inactive" | "pending" | "ok" | "alert";

export type PaymentChecks = {
  verificationOfPayee?: CheckStatus;
  fraud?: CheckStatus;
  sanctions?: CheckStatus;
  pep?: CheckStatus;
};
