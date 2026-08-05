---
name: payment-drafts
description: Prepare, approve, and optionally submit Hausbank-Agent payments to the bank. Use for Zahlungsentwürfe, Freigaben, and Send payment to bank / Submit payment to bank.
---

# Payments — Draft, Approve, Send to Bank

Full Hausbank-Agent payment pipeline (when the user asks):

`collect data → resolve vendor/customer → create/update draft → confirm → approve → send to bank → status`

## Steps

1. Resolve payee: existing `hausbank_agent_get_vendor` / list, or create via `vendors-customers` skill first.
2. Resolve debtor account via `hausbank_agent_list_accounts` if needed.
3. Build payment `body` (amount, currency, remittance/purpose, dates, vendor/account refs as required by Hausbank-Agent). For Instant, set Instant/SEPA Instant fields **only if** the payment API schema supports them — do not invent fields.
4. Confirm amount, IBAN, name, and purpose with the user.
5. `hausbank_agent_create_payment` (draft). Adjust with `update_payment` if needed.
6. On explicit request to freigeben: `hausbank_agent_approve_payment`.
7. On explicit request to **send / submit to bank**: `hausbank_agent_send_payment_to_bank` — only after clear user confirmation (amount, payee, IBAN).
8. Optionally `hausbank_agent_update_payment_status_from_bank` / `get_payment` to report status.

## Also available

- `hausbank_agent_list_payments` / `get_payment` — status overview
- `hausbank_agent_reopen_payment` — only if the user asks to reopen
- `hausbank_agent_delete_payment` — only with explicit confirmation
- `hausbank_agent_list_sepa_bics` / `list_purpose_codes` — helpers when enriching drafts

## Rules

- Never invent payment or bank responses.
- Do **not** call `send_payment_to_bank` unless the user clearly asks to send/submit to the bank.
- Always confirm before send-to-bank (destructive).
- Do not use Starne / standalone payment-link tools unless the user explicitly asks for that product feature.
