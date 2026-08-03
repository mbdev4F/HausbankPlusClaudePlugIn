---
name: zipa-payment
description: This skill should be used when the user wants to create a ZIPA payment, initiate a payment draft in Hausbank Plus, or prepare a payment that will later go through Verification of Pay and multi-stage approval to Deutsche Bank.
---

# ZIPA Payment Creation

## Goal

Create a ZIPA payment draft ready for VoP and multi-stage approval — not a silent send to the bank.

## Mandatory sequence

1. Collect payment data: debtor account, creditor name/IBAN, amount, currency, remittance, execution date, urgency.
2. Validate completeness; ask for missing fields.
3. Call `create_zipa_payment` → keep returned `paymentId`.
4. **Always** continue with Verification of Pay (`verification-of-pay` skill) before approval.
5. Do **not** call `send_payment_to_bank` from this skill.

## Confirmation

Before calling `create_zipa_payment`, show a clear summary and get explicit user confirmation for amount, IBAN, and beneficiary.

## Stub awareness

If MCP returns not-implemented, stop and request the ZIPA Payments API spec.
