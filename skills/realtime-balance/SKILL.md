---
name: realtime-balance
description: This skill should be used when the user asks for live account balances, cash positions, realtime balances, or Hausbank Plus / Deutsche Bank / Postbank First account liquidity.
---

# Realtime Balance

## Goal

Fetch current balances from the global Deutsche Bank / Hausbank Plus account setup (including Postbank First where applicable).

## Workflow

1. Clarify account scope: single IBAN/accountId, entity, currency, or “all visible accounts”.
2. Call MCP tool `list_global_accounts` if the account id is unknown.
3. Call MCP tool `get_realtime_balance` with the resolved account identifier(s).
4. Present: account name/IBAN (masked if sensitive policy requires), booked balance, available balance, currency, as-of timestamp, source system.
5. If the tool returns a stub/not-implemented response, say so clearly and ask for the Balance API spec.

## Rules

- Read-only — never trigger payments from this skill.
- Do not fabricate balances.
- Prefer structured tables for multiple accounts.
