---
name: bank-dashboard
description: >-
  Fetch bank accounts/balances and render a visual HTML/CSS dashboard.
  Use when the user asks for Bankkonten, Kontenübersicht, Kontostände, cash
  position, Umsätze overview, or a bank dashboard.
---

# Bank Dashboard

When the user asks about **Bankkonten**, balances, or a bank overview: load live data, then write a **visual HTML dashboard** — not a markdown table dump.

## Steps

1. Load data (read-only):
   - `hausbank_agent_list_accounts` (optional `$top` / `$select` via `query`).
   - If balances look stale or the user wants a bank refresh: `hausbank_agent_update_from_bank` for the relevant account(s), then re-list or `hausbank_agent_get_account`.
   - `hausbank_agent_list_transactions` for a sensible window (last 7–30 days, `$top=20`–`50`). Prefer accounts the user cares about.
2. Never invent balances or transactions. If a tool fails, say so and still render what you have.
3. **Render the dashboard** as a single HTML file using the standard design:
   - Copy [template.html](template.html) as the base (same CSS, structure, tokens).
   - Replace the placeholder sections (`SUMMARY_CARDS`, `ACCOUNT_CARDS`, `TX_ROWS`, `META_DATE`) with real data.
   - Remove HTML comments that only document placeholders.
   - Omit empty sections entirely (no “keine Daten”-Platzhalter-Karten).
4. Write the file to `dashboards/bank-accounts.html` in the workspace (create `dashboards/` if needed). Overwrite on repeat runs unless the user asks for a dated copy.
5. Tell the user the file path briefly; offer follow-ups (one account, longer period, draft payment).

## Design rules (do not freestyle)

- Keep the CSS from `template.html` — same colors, layout, typography.
- Do **not** add gradients, emojis, purple themes, glow, or extra card chrome.
- Format amounts with German locale (`de-DE`): `1.234,56 €`, sign-aware classes `.pos` / `.neg`.
- Mask or show full IBAN as returned; do not invent IBANs.
- Title/brand stay “Hausbank Agent” / “Bankkonten” unless the user asks otherwise.

## Chat response

Keep the chat short: 1–2 sentences + path to the HTML file. Do not paste the full HTML into chat.

## Rules

- Read-only. Do not create payments or change master data unless the user asks.
- Never invent balances or transactions.
