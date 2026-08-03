---
name: fx-forward
description: This skill should be used when the user wants to initiate an FX forward, Devisentermingeschäft, currency forward booking, or check FX forward status in Hausbank Plus / Deutsche Bank global markets connectivity.
---

# FX Forward Initiation

## Goal

Initiate an FX forward and track its status.

## Workflow

1. Collect: buy/sell currencies, notional, rate type (spot+points / outright if offered), value/fix date, accounts, entity.
2. Show risk summary (currency pair, amounts, dates) and get explicit confirmation.
3. Call `initiate_fx_forward`.
4. Store returned `fxDealId` / reference.
5. Optionally `get_fx_forward_status` for confirmation/settlement state.

## Rules

- Destructive: never book without confirmation.
- No invented market rates — only API-returned or user-provided rates as the contract requires.
- Stub → request FX Forward API spec.
