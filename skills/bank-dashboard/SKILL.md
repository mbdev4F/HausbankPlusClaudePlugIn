---
name: bank-dashboard
description: Show an SME bank dashboard — account balances and recent transactions. Use when the user asks for a bank dashboard, Kontostände, cash position, or Umsätze overview.
---

# Bank Dashboard

When the user asks for a bank dashboard (or balances / recent activity), build a clear overview — not a raw API dump.

## Steps

1. `hausbank_agent_list_accounts` (optionally `$top` / `$select` via `query`).
2. If balances look stale or the user wants a bank refresh: `hausbank_agent_update_from_bank` for the relevant account(s), then re-list or `hausbank_agent_get_account`.
3. `hausbank_agent_list_transactions` with a sensible window (e.g. last 7–30 days, `$top=20`–`50`). Prefer the accounts the user cares about.
4. Present a **dashboard**:
   - Accounts: name/IBAN, currency, booked/available balance if present
   - Highlights: largest outflows/inflows, open items if obvious
   - Recent transactions: date, amount, counterparty/remittance (truncated)
5. Offer follow-ups: filter one account, longer period, or draft a payment from a vendor.

## Rules

- Read-only. Do not create payments or change master data unless the user asks.
- Never invent balances or transactions.
- Never call `hausbank_agent_send_payment_to_bank`.
