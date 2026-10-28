# TIPS — more data we could read from PDFs

Today the reader takes 4 things from a pension statement: pillar, fund, balance, date.
Statements and other documents users already have contain much more. Ranked by **impact on our numbers** and **effort**.

Rule for all of these: the AI reads, **our code computes**, the user **checks** before anything is saved. Fictional PDFs only in the demo.

---

## 🥇 High impact

### 1. Monthly Pillar II contributions → gross salary (and one question less)
- Pillar II statements list the monthly contributions. These are **4.75% of gross salary** by law.
- Gross salary = contribution ÷ 0.0475. Net ≈ gross × 0.585.
- Result: we can **pre-fill the salary question** and check that the typed salary makes sense (would have caught the "1 RON salary" bug).

### 2. Join date in Pillar II → years worked
- The statement shows when the person joined the fund (*data aderării*) or the first contribution.
- Gives a good lower bound for **years worked** → pre-fill question 3.

### 3. State pension statement from CNPP → real Pillar I
- People can get their contribution record (*stagiu de cotizare*, *puncte*) from CNPP / the online pension portal.
- Our weakest number today is the state pension (we assume 48% of salary). With real points we could compute it properly.
- Biggest accuracy jump of all. Effort: medium (different document layout).

## 🥈 Medium impact

### 4. Contribution history → "money you added vs. growth"
- Total contributions vs. current value = how much the fund earned.
- Nice simple screen: *"You put in 38,000 RON, the fund made it 42,000 RON."*

### 5. Fund name + fees → honest comparison
- Statements show the fund and the fees (management fee on assets, fee on contributions).
- We could show *"Your fund costs you ~X RON/year"* — useful education, no advice.

### 6. Pillar III: employer contributions
- Pillar III statements separate **your** contributions from your **employer's**.
- If the employer already pays, we can say *"Your employer adds X; with zile. you add Y on top."*

### 7. Tax-deductible tracker (400 €/year)
- From Pillar III contributions this year → *"You can still add Z RON this year and pay less tax."*
- A strong month-end message in November/December.

## 🥉 Nice to have

### 8. Bank statement PDF (for people who don't connect a card)
- Read card payments from a monthly bank statement PDF → compute round-ups without PSD2.
- Good fallback, and a good **demo** option: "upload last month's statement, see what you would have saved".

### 9. Payslip (*fluturaș de salariu*) → exact net and gross
- One payslip gives net, gross, CAS (pension contribution), meal tickets.
- Most precise salary source; asks for a sensitive document, so optional only.

### 10. Recurring payments → "subscription" suggestions
- From transactions: Netflix, Spotify, gym… → *"Your subscriptions are 210 RON/month. 10% of that would add 3 days of freedom a month."* (education, not advice)

---

## Privacy note
More data = more responsibility. Real statements contain name, CNP and address. In production:
- send the AI only what it needs (or strip personal data first),
- sign a data processing agreement with the AI provider,
- delete PDFs after extraction unless the user wants them kept.

## Suggested next step
Do **#1 and #2** first: same document we already read, two more fields in the prompt, and onboarding gets shorter and safer.
