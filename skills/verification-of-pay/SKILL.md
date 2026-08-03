---
name: verification-of-pay
description: This skill should be used when running Verification of Payee (VoP) before approving or sending a CB-Connect SEPA Instant payment.
---

# Verification of Pay (VoP)

1. Require payee name, payee IBAN, debtor IBAN.
2. Call `verify_payee`.
3. Match → continue; close/no-match → stop or require explicit override.
4. Never skip VoP before `initiate_instant_payment`.
