---
name: payment-search
description: >
  Find where a payment is — SWIFT network whereabouts (UETR/GPI/G4C) and SEPA Instant
  status by correlation id / endToEndIdentification. Use when the user asks
  "where is my payment", Zahlungsstatus, Aufenthaltsort, UETR, or SEPA status.
---

# Payment Search — Where Is My Payment?

Read/search only. Never initiate or send payments.

## 1. SWIFT — network whereabouts

Prefer a **UETR** when the user has one.

### Via Hausbank-Agent Payment Tracker (G4C) — live path

**With UETR**

1. `hausbank_agent_list_g4c_payments` with `uetr` set (events/remittances expand by default).
2. Summarize status, timeline, and remittance info from the response.

**Without UETR (network search)**

1. Collect filters (date window, account, reference).
2. `hausbank_agent_create_g4c_search` with an appropriate `body`.
3. `hausbank_agent_run_g4c_swift_search` for that `g4cId` (SWIFT network search).
4. `hausbank_agent_list_g4c_searches` / `list_g4c_payments` to present results.

### Via CB-Connect SWIFT GPI (when `get_swift_payment_status` is available)

1. Prefer `scenario: "uetr"` + `uetr`.
2. Otherwise `timeWindowNext` / `timeWindowCreditor` with start/end and account filters.
3. Present timeline/status codes from the response — do not invent settlement.

## 2. SEPA Instant — status by correlation / E2E id

SEPA Instant status enquiry needs:

- **debtor IBAN**
- **endToEndIdentification** (max 35 chars)

### Correlation id → E2E

If the user gives a **correlation id** from initiation:

- FX4Cash-style: header `x-correlation-identifier` = `PYMT` + body E2E → strip `PYMT` prefix for the status body.
- Instant initiation returns both `correlationId` and `endToEndIdentification` — prefer the **endToEndIdentification** for `get_instant_payment_status`.
- If only a correlation id is known and the prefix is unknown, ask the user for the E2E id or the initiation response.

### Call

When available: `get_instant_payment_status` with `debtorIban` + `endToEndIdentification`.

### Hausbank-Agent payment record

If the user has a **paymentId**:

1. `hausbank_agent_get_payment` / `list_payments` for the stored status.
2. Optionally `hausbank_agent_update_payment_status_from_bank` to refresh from the bank.
3. Report status fields from the API — do not invent.

## 3. Presenting results

- State clearly: rail (SWIFT vs SEPA), identifiers used, and last known status.
- Include timeline / GPI events when present.
- If empty or HTTP error: say so; suggest missing filters (UETR, IBAN, E2E, date window).

## Rules

- Never invent UETR/GPI events or SEPA statuses.
- Read/search only — for drafts/approve/send use `payment-drafts` / `payment-ops-agent`.
