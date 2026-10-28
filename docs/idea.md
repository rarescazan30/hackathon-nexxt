# Idea: zile. — "How will you live in retirement?"

Status: **decided.** The full plan, with numbers and screens, is in [plan.md](plan.md).

## One-liner

Want to find out how you'll live in retirement? zile. shows you, then helps you improve it
one tap a month.

## Who it serves

People in Romania aged 30–40 with a job and a Pillar II account, who can't picture their
retirement and so don't save for it. A lifestyle app, not a budgeting or investing app.

## The one problem

Retirement is abstract. People don't feel the gap between the state pension (~48% of
today's net salary) and the life they have now, so voluntary saving (Pillar III) stays low.

## Core experience

1. **Onboarding (~1 min):** upload a Pillar II/III statement (AI reads it) → year of birth,
   net salary, years worked → **reveal:** a 3D scene of how you'd live if you retired today.
2. **Every day:** card payments are rounded up into a counter (no money moves).
3. **Month end:** "Add 229 RON to your Pillar III?" → Yes / another amount / skip.
4. **Progress:** days of freedom at the top; XP and levels upgrade the scene one object at
   a time (home, transport, food, extras).

## Business model

The confirmed monthly amount is held for one month by a licensed banking partner, then
sent to the user's Pillar III. The interest from that month is our revenue. Stated in the
terms and on the confirm screen. Partner offers at milestones: pitch only.

## What is real vs simulated

| Step | Demo | Production |
|---|---|---|
| Spending data | mock bank sync | bank via PSD2 |
| Statement reading | Gemini (sample values when AI is off) | same |
| Collection | ledger in our database (Stripe test mode planned) | partner bank debit |
| Pillar III purchase | ledger with unit prices | the pension fund |
