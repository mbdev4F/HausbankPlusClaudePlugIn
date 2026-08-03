/** FX4Cash Evaluate — Valutadatum vor Zahlungsauslösung prüfen (POST valueDate). */

export type Fx4CashValueDateScenario = "notFound" | "dateRejected" | "dateAccepted";

export type Fx4CashValueDateParams = {
  accountNumber: string;
  currencyPair: string;
  suggestedValueDate: string;
};

export type Fx4CashValueDateScenarioMeta = {
  id: Fx4CashValueDateScenario;
  label: string;
  description: string;
  buttonLabel: string;
};

/** Sandbox-Konto aus DB-Referenz-curl. */
export const FX4CASH_VALUE_DATE_SANDBOX_ACCOUNT = "2699130-00-0";

export const FX4CASH_VALUE_DATE_PROBE_SCENARIOS: Fx4CashValueDateScenarioMeta[] = [
  {
    id: "notFound",
    label: "404 — ungültiges Währungspaar",
    description: "currencyPair SGDABC → HTTP 404",
    buttonLabel: "404-Fall testen",
  },
  {
    id: "dateRejected",
    label: "false — Valuta abgelehnt",
    description: "SGDGBP, suggestedValueDate 2026-05-05",
    buttonLabel: "false-Fall testen",
  },
  {
    id: "dateAccepted",
    label: "true — Valuta bestätigt",
    description: "SGDGBP, suggestedValueDate = heute",
    buttonLabel: "true-Fall testen",
  },
];

export function defaultFx4CashValueDateParams(
  scenario: Fx4CashValueDateScenario,
  now = new Date()
): Fx4CashValueDateParams {
  const today = now.toISOString().slice(0, 10);

  if (scenario === "notFound") {
    return {
      accountNumber: FX4CASH_VALUE_DATE_SANDBOX_ACCOUNT,
      currencyPair: "SGDABC",
      suggestedValueDate: "2026-05-05",
    };
  }

  if (scenario === "dateRejected") {
    return {
      accountNumber: FX4CASH_VALUE_DATE_SANDBOX_ACCOUNT,
      currencyPair: "SGDGBP",
      suggestedValueDate: "2026-05-05",
    };
  }

  return {
    accountNumber: FX4CASH_VALUE_DATE_SANDBOX_ACCOUNT,
    currencyPair: "SGDGBP",
    suggestedValueDate: today,
  };
}

export function buildFx4CashValueDateBody(
  params: Fx4CashValueDateParams
): Record<string, string> {
  return {
    accountNumber: params.accountNumber.trim(),
    currencyPair: params.currencyPair.trim().toUpperCase(),
    suggestedValueDate: params.suggestedValueDate.trim(),
  };
}

export function formatFx4CashValueDateJson(
  params: Fx4CashValueDateParams
): string {
  return JSON.stringify(buildFx4CashValueDateBody(params), null, 2);
}

/** Belastungs- + Gutschriftwährung ohne Trennzeichen (z. B. EURUSD). */
export function buildFx4CashCurrencyPair(
  debitCurrency: string,
  creditCurrency: string
): string {
  return `${debitCurrency.trim().toUpperCase()}${creditCurrency.trim().toUpperCase()}`;
}
