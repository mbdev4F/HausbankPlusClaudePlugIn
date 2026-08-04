---
name: SEPA-payment
description: This skill should be used when the user wants to create or send a SEPA Instant Transfer (SEPA-equivalent) via Deutsche Bank CB-Connect.
---

# SEPA Instant Payment (SEPA)

1. Collect debtor/creditor name, IBAN, BIC, amount, currency, remittance.
2. Confirm details with the user.
3. Run VoP first (`verification-of-pay` skill / `verify_payee`).
4. Call `initiate_instant_payment` only after confirmation + VoP.
5. Track with `get_instant_payment_status`.
