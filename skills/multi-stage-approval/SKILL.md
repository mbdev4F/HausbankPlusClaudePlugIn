---
name: multi-stage-approval
description: This skill should be used when guiding CB-Connect payment release through confirmation and VoP before bank submission.
---

# Approval & Bank Release

Logical flow:

`draft → vop_ok → user_confirmed → initiate_instant_payment → status_tracked`

1. Confirm VoP is acceptable.
2. Get explicit user go-ahead for amount/IBAN/beneficiary.
3. Call `initiate_instant_payment`.
4. Offer `get_instant_payment_status` and optionally SWIFT tracking.
