---
name: global-account-statements
description: This skill should be used when the user requests CB-Connect account statements or CAMT retrieval for a date range.
---

# Account Statements

1. Collect branch, currency, account id, dateFrom, dateTo, optional type (EOD/INT).
2. Call `request_account_statement` → keep `serviceRequestId`.
3. Call `load_account_statement` with that id.
4. Summarize; do not dump huge CAMT payloads unless asked.
