---
name: payment-drafts
description: Prepare and approve Hausbank-Agent payment drafts (SEPA / Instant when supported in the payment body). Use when creating Zahlungsentwürfe, Freigaben, or preparing payments from vendors. Never send payments to the bank.
---

# Payment Drafts & Approval

Claude may prepare drafts and run **approvals**. Bank initiation stays in the Hausbank product — **not** Claude.

## Allowed pipeline

`collect data → resolve vendor/customer → create/update draft → user confirms → approve → stop`

1. Resolve payee: existing `hausbank_agent_get_vendor` / list, or create via `vendors-customers` skill first.
2. Resolve debtor account via `hausbank_agent_list_accounts` if needed.
3. Build payment `body` (amount, currency, remittance/purpose, dates, vendor/account refs as required by Hausbank-Agent). For Instant, set Instant/SEPA Instant fields **only if** the payment API schema supports them — do not invent fields.
4. Confirm amount, IBAN, name, and purpose with the user.
5. `hausbank_agent_create_payment` (draft). Adjust with `update_payment` if needed.
6. On explicit user request to freigeben: `hausbank_agent_approve_payment`.
7. Tell the user the payment is **approved / ready for bank** and that **sending to the bank** must be done in the Hausbank Connector / product UI — not here.

## Also available

- `hausbank_agent_list_payments` / `get_payment` — status overview
- `hausbank_agent_reopen_payment` — only if the user asks to reopen
- `hausbank_agent_delete_payment` — only with explicit confirmation
- `hausbank_agent_list_sepa_bics` / `list_purpose_codes` — helpers when enriching drafts

## Hard stop

- **Never** call `hausbank_agent_send_payment_to_bank`.
- **Never** call Starne / standalone payment-link tools.
- **Never** claim the payment was sent to the bank after approve.
