# PDF reader — pension statements and bank statements

Status: **built**, works with a Gemini key. Without a key it returns sample values (demo safety net).

Since v2.3 one upload box takes both kinds; the AI decides which it is (`lib/ai/extract-document.ts`):
- **Pension statement** → provider, balance, date → the user checks → saved (flow below).
- **Bank statement** → its transactions → card payments added to the history right away, skipping ones we already have (same day + amount + first word of the merchant; `lib/server/statement-import.ts`). Only the open month's round-ups change. Demo file: `data/demo/bank-statement-demo.pdf`.
- If the AI fails on a pension upload, a manual card opens by itself.

## The flow, step by step

1. **Upload** — onboarding step 1, the user picks a PDF (`components/onboarding/documents-step.tsx`).
2. **Checks** — server action `uploadStatement` (`app/onboarding/actions.ts`):
   - must be a PDF, max 5 MB;
   - user id comes from the session, never from the browser.
3. **Store** — the file goes to the private Supabase bucket `statements`, in a folder named after the user id (`<userId>/<random>.pdf`). Only that user can read it (storage policies).
4. **Log** — a row in `statement_uploads` (status `uploaded`).
5. **Read** — `extractStatement` (`lib/ai/extract-statement.ts`) sends the PDF to Gemini with a short instruction and asks for JSON.
6. **Validate** — our code, not the AI, checks the answer with Zod and converts RON → bani.
7. **Show** — the result appears as an editable card tagged *"Read by AI, please check"*. The user can fix any field.
8. **Save** — only when the user finishes onboarding: `pension_assets` row (source `statement_upload`), upload status `confirmed`.

If anything fails, the user sees a clear message and can type the numbers in. The AI never saves anything by itself.

## What the AI must find in the PDF

| Field | What it is | Typical Romanian wording |
|---|---|---|
| `kind` | Pillar II or Pillar III | *Pensie administrată privat* / *Pilonul II* → `pillar2`; *Pensie facultativă* / *Pilonul III* → `pillar3` |
| `provider` | Fund / administrator name | e.g. *NN Pensii*, *Allianz-Țiriac Pensii Private*, *Metropolitan Life*, *BRD*, *BCR*, *Aegon/Vienna*… |
| `balanceRon` | Total account value, in RON | *Valoarea totală a contului*, *Activul personal*, *Valoarea activului personal net*, *Sold* |
| `asOf` | Date the balance refers to | *La data de*, *Situația la*, *Perioada …–31.12.2025* (use the end date) |

The prompt also tells it: if this is not a pension statement, answer `{"error": "not_a_statement"}`.

Answer format (exact):
```json
{"kind": "pillar2", "provider": "NN Pensii", "balanceRon": 42000.00, "asOf": "2026-09-30"}
```

## What we do with the answer

- `balanceRon` × 100 → `balanceBani` (integer).
- Date must be `YYYY-MM-DD`; balance ≥ 0; provider not empty. Anything else → *"We couldn't read this file"*.
- Shown to the user for checking before it counts.

## Technical details

- Model: Gemini (`gemini-3.5-flash-lite`, then `gemini-3.8-flash` as fallback), PDF sent inline as base64, JSON mode on, 25 s timeout.
- Groq can't read PDFs, so with `AI_PROVIDER=groq` the reader falls back to "type it in".
- `AI_PROVIDER=mock` (or no key) → sample values: NN Pensii, 42,000 RON, 30 Sep 2026, tagged *"Sample values (AI is off in this demo)"*.
- Privacy: only fictional PDFs in the demo. Real statements contain CNP and name; in production we would need a DPA with the AI provider, or strip personal data before sending.

## What's left to do

- [ ] Put a **valid** Gemini key in `.env.local`. The current one is rejected by Google (HTTP 401 "API key not valid"), so uploads show *"We couldn't read this file"*. The server log now prints `Gemini <model>: HTTP 401` when that happens. Create a new key in Google AI Studio (aistudio.google.com) and paste it as `GEMINI_API_KEY`.
- [x] Make a Pillar III demo PDF (`data/demo/pillar3-statement-demo.pdf`, BT Pensii, 8,857.26 RON on 30.09.2026).
- [ ] Test with 2–3 different layouts (one-page summary, multi-page with contribution table, scanned image PDF).
- [ ] Tell the AI to prefer the **latest** date when a statement shows several balances.
- [x] Reuse the same upload in Profile → *Update your details* (plan-qol.md phase 3).

## How to check it yourself

1. Put `GEMINI_API_KEY` in `.env.local`, restart the server.
2. Register a new account, upload `data/demo/pillar2-statement-demo.pdf`.
3. The card should say *"Read by AI, please check"* with the values printed in the PDF.
4. Upload any non-pension PDF → you should get *"This doesn't look like a pension statement"*.
