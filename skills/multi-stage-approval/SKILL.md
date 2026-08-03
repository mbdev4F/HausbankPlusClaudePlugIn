---
name: multi-stage-approval
description: This skill should be used when the user submits, approves, or rejects Hausbank Plus payments in a multi-level approval workflow, or when releasing a payment for send to Deutsche Bank after Verification of Pay.
---

# Multi-Stage Approval & Bank Release

## Goal

Move a payment through approval levels and only then release it to Deutsche Bank.

## States (logical)

`draft → vop_ok → approval_L1 → approval_Ln → ready_to_send → sent`

## Workflow

1. Confirm VoP status is acceptable (`vop_ok` or documented override).
2. `submit_for_approval` with `paymentId`.
3. For each required level, call `approve_payment` (or `reject_payment`) with approver role/level as required by the API.
4. When fully approved, confirm with the user, then `send_payment_to_bank`.
5. After send, offer SWIFT status tracking (`swift-payment-status` skill).

## Rules

- Refuse to send if VoP failed and no explicit override.
- Refuse to skip approval levels.
- Destructive tools need an explicit user go-ahead at each stage (submit, each approve, final send).
- On reject: stop the chain and report `paymentId` + reason.
