# data/: mock data, personas, RAG corpus

Owner: **Product / Pitch (PM)**. Read the root `AGENTS.md` first.

## Purpose

Everything the app runs on before (and instead of) real data.

```
data/mock/      mock bank data in NextGenPSD2 format, product unit prices
data/personas/  demo personas and their expected results (used by tests)
data/corpus/    official source documents for RAG (PDF/HTML/MD)
```

## Rules

- **Fictional data only.** No real names, IBANs, CNPs or transactions.
- Mock bank data follows the NextGenPSD2 transaction shape: `transactionAmount.amount`
  is a string, negative for money out; `remittanceInformationUnstructured` holds the
  description. It must validate against the schemas in `lib/contracts.ts`.
- Make transactions realistic for Romania: merchants, amounts in RON, rent, utilities,
  groceries, salary on a fixed day.
- Every corpus document has its source URL and date recorded next to it.
- Product price histories (funds, ETF, Pillar III) are static snapshots with a noted source.

## Files

- `mock/ui.ts`: mock data the prototype screens import today (user, activity, history,
  projection, allocation). Replace piece by piece with data from the API.

Planned (draft):

- `mock/psd2_<persona>.json`: 6 months of transactions
- `personas/<persona>.json`: profile, risk level, expected round-ups and days of freedom
- `mock/products.json`: products per risk level with historical unit prices
