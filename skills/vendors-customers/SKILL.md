---
name: vendors-customers
description: Create or update payment counterparties — vendors (Kreditoren) and customers (Debitoren / Rechnungsempfänger). Use when adding Zahlungsempfänger, syncing from an ERP connector, or managing Stammdaten for later payment drafts.
---

# Vendors & Customers

Maintain counterparties in Hausbank-Agent for later payment drafts.

## On demand

- **Vendor (Kreditor / Zahlungsempfänger):** `hausbank_agent_list_vendors` → `create_vendor` / `update_vendor` / `get_vendor`
- **Customer (Debitor / Rechnungsempfänger):** `hausbank_agent_list_customers` → `create_customer` / `update_customer` / `get_customer`

Collect at least: display name, IBAN (normalized, no spaces), optional BIC, address/reference fields the API accepts in `body`. Confirm with the user before create/update.

## From another ERP connector

If the user says e.g. “go into my ERP and create that payee here in banking”:

1. Use the **ERP MCP tools** (other connector) to fetch the party (name, IBAN, BIC, external id).
2. Map fields into a Hausbank-Agent vendor or customer `body`.
3. Check for an existing match (`list_vendors` / `list_customers` by name or IBAN) to avoid duplicates.
4. Create or update in Hausbank-Agent.
5. Report the new banking id and what was copied from ERP.

If no ERP connector is available, ask the user for the fields or to enable their ERP connector.

## Rules

- Do not delete counterparties unless the user explicitly requests it.
- Do not initiate bank payments. Creating a vendor/customer is master data only.
- Never call `hausbank_agent_send_payment_to_bank` or Starne tools.
