import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  projectedRetirementIncome,
  tierFromRatio,
  firstLevelOfTier,
  xpForLevelUp,
  xpFromContributions,
  slotsAtLevel,
  slotUnlockedAt,
  levelState,
  formatFreedom,
  formatRon,
  MAX_LEVEL,
  floatInterestBani,
} from "../index";

const andrei = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "data/personas/andrei.json"), "utf-8")
);

test("projectedRetirementIncome: Andrei (34) lands in tier 3", () => {
  const income = projectedRetirementIncome({
    age: andrei.age,
    netSalaryBani: andrei.salaryBani,
    yearsWorked: andrei.yearsWorked,
    pillarTwoBani: andrei.pillarTwoBani,
    pillarThreeBani: andrei.pillarThreeBani,
  });
  // Full contribution record: 48% of 6,500 RON from the state.
  assert.strictEqual(income.statePensionBani, 312000);
  assert.strictEqual(
    income.totalMonthlyBani,
    income.statePensionBani + income.pillarTwoMonthlyBani + income.pillarThreeMonthlyBani
  );
  assert.ok(income.replacementRatio > 0.72 && income.replacementRatio < 0.85);
  assert.strictEqual(tierFromRatio(income.replacementRatio), andrei.expectedStartTier);
});

test("projectedRetirementIncome: a short career scales the state pension down", () => {
  const income = projectedRetirementIncome({
    age: 64,
    netSalaryBani: 500000,
    yearsWorked: 16, // 16 + 1 year left = 17 of 35
    pillarTwoBani: 0,
    pillarThreeBani: 0,
  });
  assert.strictEqual(income.statePensionBani, Math.round(500000 * 0.48 * (17 / 35)));
  assert.strictEqual(tierFromRatio(income.replacementRatio), 1);
});

test("tierFromRatio and firstLevelOfTier", () => {
  assert.strictEqual(tierFromRatio(0.4), 1);
  assert.strictEqual(tierFromRatio(0.6), 2);
  assert.strictEqual(tierFromRatio(0.75), 3);
  assert.strictEqual(tierFromRatio(0.9), 4);
  assert.strictEqual(tierFromRatio(1.2), 5);
  assert.deepStrictEqual([1, 2, 3, 4, 5].map(firstLevelOfTier), [1, 5, 9, 13, 17]);
});

test("xpForLevelUp: early level-ups are cheap, later ones grow", () => {
  assert.deepStrictEqual([1, 2, 3, 4, 5].map(xpForLevelUp), [300, 400, 450, 600, 750]);
});

test("xpFromContributions: days × 20 plus a streak bonus for consecutive months", () => {
  // 225 RON adds 6 days for Andrei's salary → 120 XP each.
  const single = xpFromContributions([{ month: "2026-05", amountBani: 22500 }], andrei.salaryBani);
  assert.strictEqual(single, 120);

  const streak = xpFromContributions(
    [
      { month: "2026-05", amountBani: 22500 },
      { month: "2026-06", amountBani: 22500 },
      { month: "2026-08", amountBani: 22500 }, // July skipped: no bonus for August
    ],
    andrei.salaryBani
  );
  assert.strictEqual(streak, 120 * 3 + 20);

  // Year boundary counts as consecutive.
  const newYear = xpFromContributions(
    [
      { month: "2026-12", amountBani: 22500 },
      { month: "2027-01", amountBani: 22500 },
    ],
    andrei.salaryBani
  );
  assert.strictEqual(newYear, 120 * 2 + 20);
});

test("slotsAtLevel: one slot upgrades per level, home first", () => {
  assert.deepStrictEqual(slotsAtLevel(1), { home: 1, transport: 1, food: 1, extras: 1 });
  assert.deepStrictEqual(slotsAtLevel(5), { home: 2, transport: 1, food: 1, extras: 1 });
  assert.deepStrictEqual(slotsAtLevel(6), { home: 2, transport: 2, food: 1, extras: 1 });
  assert.deepStrictEqual(slotsAtLevel(8), { home: 2, transport: 2, food: 2, extras: 2 });
  assert.deepStrictEqual(slotsAtLevel(MAX_LEVEL), { home: 5, transport: 5, food: 5, extras: 5 });
  assert.strictEqual(slotUnlockedAt(9), "home");
  assert.strictEqual(slotUnlockedAt(10), "transport");
});

test("levelState: costs count from the starting level", () => {
  const start = firstLevelOfTier(3); // 9
  const fresh = levelState(start, 0);
  assert.strictEqual(fresh.level, 9);
  assert.strictEqual(fresh.xpForNext, 300);
  assert.strictEqual(fresh.isMilestone, true);
  assert.deepStrictEqual(fresh.next, { slot: "transport", tier: 3 });

  const later = levelState(start, 680); // 300 for level 10, 380 into the next 400
  assert.strictEqual(later.level, 10);
  assert.strictEqual(later.xpIntoLevel, 380);
  assert.strictEqual(later.xpForNext, 400);
  assert.strictEqual(later.isMilestone, false);

  const capped = levelState(19, 1_000_000);
  assert.strictEqual(capped.level, MAX_LEVEL);
  assert.strictEqual(capped.xpForNext, null);
  assert.strictEqual(capped.next, null);
});

test("formatFreedom and formatRon (English UI)", () => {
  assert.strictEqual(formatFreedom(0), "0 days");
  assert.strictEqual(formatFreedom(1), "1 day");
  assert.strictEqual(formatFreedom(12), "12 days");
  assert.strictEqual(formatFreedom(30), "1 month");
  assert.strictEqual(formatFreedom(125), "4 months 5 days");
  assert.strictEqual(formatFreedom(andrei.expectedDaysOfFreedom.base), "3 years 2 months");
  assert.strictEqual(formatFreedom(365), "1 year");
  assert.strictEqual(formatRon(129350), "1,293.50 RON");
  assert.strictEqual(formatRon(16942, { wholeRon: true }), "169 RON");
});

test("floatInterestBani: interest on the one-month hold", () => {
  assert.strictEqual(floatInterestBani(50000, 30), 205); // 500 RON, 30 days, 5% → 2.05 RON
  assert.strictEqual(floatInterestBani(50000, 0), 0);
  assert.strictEqual(floatInterestBani(-100, 30), 0);
  assert.strictEqual(floatInterestBani(50000, 30, 0.06), 247);
});
