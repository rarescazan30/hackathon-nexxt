# Judging prep

The four things the judges asked us to demonstrate, who owns each, and the evidence.

| Point | Owner | Evidence in the product / pitch |
|---|---|---|
| Who it serves, which problem | PM | persona, 3 user interviews, sourced statistics |
| Core experience end to end | Frontend + Backend | live demo: card → round-ups → end of month → days of freedom |
| Why Romania | PM | pension demographics, Pillar III, BVB, literacy data |
| Assumptions, sources, regulation, limitations | PM + AI | in-app "where does this number come from?" panel + one slide |

## Statistics to source (fill in with link + year)

| Claim | Value | Source |
|---|---|---|
| Ratio of pensioners to employees | | INS / CNPP |
| Pillar III participants | | ASF |
| Financial literacy ranking in the EU | | S&P Global FinLit / Eurobarometer |
| Share of savings in deposits/cash | | BNR |
| BET-TR vs inflation over 10+ years | | BVB / INS |

## Regulatory points (for the slide)

- Investing is done by a licensed institution (Raiffeisen / ASF-authorized partner);
  we simulate it.
- Suitability questionnaire before choosing a risk level (MiFID II).
- Reading bank data requires a PSD2 account-information licence (the bank has it).
- Holding client money needs a payment / e-money licence: in production the bank
  debits the account directly; Stripe only simulates collection.
- GDPR: minimal data, explicit consent, mock data only in the prototype.
- Education, not advice: scenarios and ranges, the user decides.

## Limitations (say them before the judges do)

- Projections are estimates with ranges, not guarantees.
- Assumes long-term market returns above Romanian inflation; we show a pessimistic
  scenario where they aren't.
- Government bonds are only available during issue windows.
- Round-ups alone are small; the simulator shows them plus an optional monthly contribution.

## Likely judge questions

- How is this different from round-ups in Revolut or other banks?
- Why should Raiffeisen build this?
- What happens if markets fall right before someone retires?
- How do you make sure the AI doesn't invent numbers?
