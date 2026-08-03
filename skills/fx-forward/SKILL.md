---
name: fx-forward
description: This skill should be used when the user wants FX4Cash initiation, value-date evaluation, or FX4Cash status via Deutsche Bank CB-Connect (cross-border FX-for-cash, not a classic FX forward contract).
---

# FX4Cash

Note: This maps to CB-Connect **FX4Cash**, not a traditional FX forward deal.

1. Optionally `evaluate_fx4cash_value_date` first.
2. Confirm amounts/currencies/accounts.
3. Call `initiate_fx4cash`.
4. Track with `get_fx4cash_status` (debtor IBAN + endToEndIdentification).
