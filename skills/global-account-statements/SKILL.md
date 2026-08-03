---
name: global-account-statements
description: This skill should be used when the user requests account statements, Kontoauszüge, transaction history, or global statement retrieval across Deutsche Bank / Postbank First / Hausbank Plus accounts.
---

# Global Account Statements

## Goal

Pull account statements across the global account landscape.

## Workflow

1. Collect: accountId/IBAN, date from/to, statement format if relevant (camt.053, PDF, JSON — whatever the API supports once specified).
2. Call `get_account_statement`.
3. Summarize totals (credits/debits/closing) and offer drill-down on bookings.
4. For large ranges, paginate via MCP tool parameters; do not dump raw megabyte payloads into chat.

## Rules

- Read-only.
- Flag missing dates or ambiguous accounts before calling tools.
- Stub responses → request Statements OpenAPI/Postman from the user.
