import test from "node:test";
import assert from "node:assert/strict";

process.env.AI_PROVIDER = "mock";

import { extractDocument, extractStatement, fallbackMonthlyMessage, monthlyOfferMessage, MOCK_BANK_TRANSACTIONS, MOCK_EXTRACT } from "../index";

const facts = { firstName: "Andrei", month: "October", amountBani: 22942, daysAdded: 6, nextUnlock: "Good groceries", levelUpNow: true };

test("fallbackMonthlyMessage: English, real numbers, mentions the unlock on a level-up", () => {
  assert.strictEqual(
    fallbackMonthlyMessage(facts),
    "Andrei, you saved 229 RON in October. That's +6 days of freedom, enough to unlock good groceries."
  );
  assert.strictEqual(
    fallbackMonthlyMessage({ ...facts, levelUpNow: false }),
    "Andrei, you saved 229 RON in October. That's +6 days of freedom in retirement."
  );
});

test("monthlyOfferMessage: mock provider uses the fallback", async () => {
  assert.strictEqual(await monthlyOfferMessage(facts), fallbackMonthlyMessage(facts));
});

test("extractStatement: mock provider returns the labelled sample", async () => {
  const result = await extractStatement(new Uint8Array([37, 80, 68, 70]));
  assert.deepStrictEqual(result, { ok: true, extract: MOCK_EXTRACT, source: "sample" });
});

test("extractDocument: with AI off, a bank statement file gives the labelled sample payments", async () => {
  const bank = await extractDocument(new Uint8Array(), "bank-statement-demo.pdf");
  assert.ok(bank.ok && bank.type === "bank" && bank.source === "sample");
  assert.deepStrictEqual(bank.transactions, MOCK_BANK_TRANSACTIONS);
  // Card payments are money out; salary and rent transfers are not card payments.
  assert.ok(bank.transactions.filter((t) => t.isCardPayment).every((t) => t.amountBani < 0));
  assert.strictEqual(bank.transactions.filter((t) => !t.isCardPayment).length, 2);

  const pension = await extractDocument(new Uint8Array(), "pillar2-statement-demo.pdf");
  assert.ok(pension.ok && pension.type === "pension" && pension.extract.provider === "NN Pensii");
});
