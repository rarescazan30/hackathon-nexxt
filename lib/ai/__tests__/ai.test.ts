import test from "node:test";
import assert from "node:assert/strict";

process.env.AI_PROVIDER = "mock";

import { extractStatement, fallbackMonthlyMessage, monthlyOfferMessage, MOCK_EXTRACT } from "../index";

const facts = { firstName: "Andrei", amountBani: 22942, daysAdded: 6, nextUnlock: "Good groceries", levelUpNow: true };

test("fallbackMonthlyMessage: English, real numbers, mentions the unlock on a level-up", () => {
  assert.strictEqual(
    fallbackMonthlyMessage(facts),
    "Andrei, you saved 229 RON this month. That's +6 days of freedom, enough to unlock good groceries."
  );
  assert.strictEqual(
    fallbackMonthlyMessage({ ...facts, levelUpNow: false }),
    "Andrei, you saved 229 RON this month. That's +6 days of freedom in retirement."
  );
});

test("monthlyOfferMessage: mock provider uses the fallback", async () => {
  assert.strictEqual(await monthlyOfferMessage(facts), fallbackMonthlyMessage(facts));
});

test("extractStatement: mock provider returns the labelled sample", async () => {
  const result = await extractStatement(new Uint8Array([37, 80, 68, 70]));
  assert.deepStrictEqual(result, { ok: true, extract: MOCK_EXTRACT, source: "sample" });
});
