---
name: swift-payment-status
description: This skill should be used when the user asks for SWIFT payment status, tracking of executed payments, GPI status, or global payment investigation for Hausbank Plus / Deutsche Bank payments.
---

# SWIFT Payment Status

## Goal

Query global status of executed payments via SWIFT (e.g. GPI / status APIs — exact product TBD by Swagger).

## Workflow

1. Identify payment via `paymentId`, end-to-end id, UETR, or account+date+amount.
2. Call `get_swift_payment_status`.
3. Present timeline: instructed → in progress → completed / rejected / returned, with bank timestamps and reason codes when present.
4. If not found, suggest alternate identifiers rather than inventing status.

## Rules

- Read-only.
- Do not claim settlement without tool evidence.
