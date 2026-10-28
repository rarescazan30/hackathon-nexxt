# Holding the money for one month and keeping the interest — is it realistic?

Question from the team: *would this need years of new legislation? If yes, it makes no sense.*

**Short answer: no new law is needed.** The model is legal **if a licensed partner holds the money**, not zile. What it needs is **partnerships and contracts (months)**, not legislation (years). We keep it in the demo as the mentor suggested.

⚠️ Research summary for the pitch, not legal advice. Check with a lawyer before building it for real.

---

## Why zile. can't hold the money itself
- Taking money from people and keeping it for later is **deposit-taking**. Only **banks** (credit institutions, licensed by BNR) can do that.
- A **payment institution** (PSD2) can't take deposits either. It may hold client money only to execute payments, and must keep it **separate and protected** ("safeguarding"). (PSD2 Art. 10 and Art. 18.)
- So: zile. as a plain app company → **cannot** hold the money.

## Three realistic ways to do it

### Option A — partner bank (recommended)
- The money sits in an account **in the user's name** at a partner bank (like a "vault" / savings pocket).
- The bank earns the interest. A **revenue-share contract** gives part of it to zile. for bringing the customers.
- Banks already do this with distribution partners. It's a commercial deal, not a law change.
- Timeline: a few months of negotiation + bank compliance checks.

### Option B — Banking-as-a-Service (BaaS) / e-money partner
- zile. works as an **agent** of a licensed e-money or payment institution.
- Client money is safeguarded at banks. Real precedent: big EU fintechs report **interest income on customer balances** as a significant source of revenue.
- Limit: under PSD2, money held by a payment institution must be for payments, not savings. Holding it on purpose for a month is a grey zone → needs the partner's legal sign-off.

### Option C — our own license
- E-money or payment institution license from BNR: capital requirements, months to over a year, compliance team. **Not for now.**

## The Pillar III side
- Selling / promoting Pillar III needs to be done by an **authorised marketing agent** of a pension administrator (ASF rules, Legea 204/2006, Norma ASF 16/2013).
- Easiest path: a **partnership with one Pillar III administrator**; zile. acts as their registered marketing channel. Platforms that do this already exist in Romania (e.g. iPensii), so the path is proven.

## Things to be careful about
- **Transparency**: the T&C must say clearly that the money is held one month and who keeps the interest. (We already do this in `/terms` and in the onboarding checkbox.)
- **Consumer protection**: the user must be able to see where the money is at any time, and get it back if they cancel during the month.
- **Tax deduction**: Pillar III is deductible up to 400 €/year. A one-month delay can move December's contribution into next year — tell the user.
- **Interest rates change.** The 5% we assume in `lib/rules/float.ts` is a demo assumption; a real partner may pay less to us after its share.

## What it means in numbers (from our model)
- 500 RON held one month at 5%/year ≈ **2.08 RON** for us.
- 1,000 users × 500 RON → ≈ **2,083 RON/month** (~25,000 RON/year).
- 100,000 users → ≈ **208,000 RON/month**.
The admin panel (plan-qol.md phase 6) shows these numbers live.

## Pitch line
> "We don't touch the money. A licensed partner bank holds each month's amount in the user's name for 30 days, then sends it to their Pillar III. The interest from those 30 days is shared with us. No new law needed, just a partner."

---

## Sources
- PSD2 Article 18 (activities of payment institutions): https://legislation.gov.uk/en/eudr/2015/2366/article/18/adopted
- EBA Q&A on holding client funds on payment accounts: https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2018_4221
- Safeguarding of client funds (overview): https://www.betaalvereniging.nl/en/knowledge-base/european-legislation/safeguarding-client-funds/
- PSD3 / PSR safeguarding changes: https://www.cliffordchance.com/content/dam/cliffordchance/briefings/2026/04/impact-of-psd3-are-you-ready.pdf
- PSD3 safeguarding (practical): https://paytechlaw.com/en/psd3-psr-safeguarding-of-customer-funds-new-rules-for-greater-protection-and-practicality-episode-110/
- Legea 209/2019 (payment services, Romania): https://legislatie.just.ro/Public/DetaliiDocument/280830
- Pillar III marketing rules (Legea 204/2006, Norma ASF 16/2013): https://legeaz.net/monitorul-oficial-3-2014/hotarare-64-2013-aprobarea/anexa-norma
- iPensii terms (existing Romanian Pillar III platform): https://www.ipensii.ro/wp-content/uploads/2024/02/Termeni-si-Conditii-de-utilizare-a-platformei-iPensii-februarie-2024.pdf
