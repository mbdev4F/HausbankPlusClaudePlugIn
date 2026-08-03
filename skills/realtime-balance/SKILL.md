---
name: realtime-balance
description: This skill should be used when the user asks for live account balances or cash positions via Deutsche Bank CB-Connect.
---

# Realtime Balance

1. Collect `branchIdentifier`, `accountCurrency`, `accountIdentifier`.
2. Call `get_realtime_balance`.
3. Present available/current balance, currency, correlation id.
4. Never invent balances.
