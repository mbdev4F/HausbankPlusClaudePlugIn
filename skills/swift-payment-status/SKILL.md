---
name: swift-payment-status
description: This skill should be used when the user asks for SWIFT GPI payment status via CB-Connect (UETR or time-window search).
---

# SWIFT Payment Status

1. Prefer UETR; otherwise time-window + account filters.
2. Call `get_swift_payment_status`.
3. Present timeline/status codes from the response — do not invent settlement.
