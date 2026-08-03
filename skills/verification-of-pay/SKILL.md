---
name: verification-of-pay
description: This skill should be used when the user must run Verification of Pay (VoP), payee verification, IBAN-name check, or confirm beneficiary matching before approving or sending a Hausbank Plus / Deutsche Bank payment.
---

# Verification of Pay (VoP)

## Goal

Verify that creditor name and account details match before any approval or bank submission.

## Workflow

1. Require a `paymentId` (from ZIPA creation) or explicit creditor details.
2. Call `verify_payee`.
3. Interpret result:
   - **match** → proceed to multi-stage approval
   - **close match / partial** → show mismatch details; require explicit user decision
   - **no match** → block approval/send; offer correct-and-retry
4. Persist VoP reference/result id with the payment when the API provides one.

## Rules

- Never skip VoP for payments destined to Deutsche Bank via this plugin.
- Never “approve despite no-match” unless the user explicitly overrides and the API allows it — document the override in the reply.
