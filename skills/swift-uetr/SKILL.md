---
name: swift-uetr
description: Look up international SWIFT payments via Hausbank-Agent Payment Tracker (G4C) using a UETR or search window. Use when the user provides a UETR / SWIFT tracking id or asks about international payment status.
---

# SWIFT / UETR (G4C)

Use Hausbank-Agent **Payment Tracker (G4C)** tools. Prefer a **UETR** when the user has one.

## With UETR

1. Call `hausbank_agent_list_g4c_payments` with `uetr` set (events/remittances expand by default).
2. Summarize status, timeline, and remittance info from the response.
3. If nothing is found, say so clearly — do not invent settlement.

## Without UETR (search)

1. Collect filters the user can give (date window, account, reference).
2. `hausbank_agent_create_g4c_search` with an appropriate `body`.
3. `hausbank_agent_run_g4c_swift_search` for that `g4cId` when a network search is needed.
4. `hausbank_agent_list_g4c_searches` / `list_g4c_payments` to present results.

## Rules

- Never invent UETR statuses or GPI events.
- Read/search only — no bank initiation.
- Never call `hausbank_agent_send_payment_to_bank`.
