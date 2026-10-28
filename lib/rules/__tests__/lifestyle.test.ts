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
  formatRatio,
  formatRon,
  MAX_LEVEL,
  floatInterestBani,
  profileError,
  daysOfFreedomFromSalary,
  daysAtRetirement,
  INFLATION_10Y_AVERAGE,
  REAL_RETURN_AFTER_INFLATION,
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

test("xpFromContributions: days × 10 plus a streak bonus for consecutive months", () => {
  // Without growth (as if at 65): 225 RON adds 6 days for Andrei's salary → 60 XP each.
  const atRetirement = { stateReplacementRate: 0.48, growthToRetirement: 1 };
  const single = xpFromContributions([{ month: "2026-05", amountBani: 22500 }], andrei.salaryBani, atRetirement);
  assert.strictEqual(single, 60);

  const streak = xpFromContributions(
    [
      { month: "2026-05", amountBani: 22500 },
      { month: "2026-06", amountBani: 22500 },
      { month: "2026-08", amountBani: 22500 }, // July skipped: no bonus for August
    ],
    andrei.salaryBani,
    atRetirement
  );
  assert.strictEqual(streak, 60 * 3 + 20);

  // Year boundary counts as consecutive.
  const newYear = xpFromContributions(
    [
      { month: "2026-12", amountBani: 22500 },
      { month: "2027-01", amountBani: 22500 },
    ],
    andrei.salaryBani,
    atRetirement
  );
  assert.strictEqual(newYear, 60 * 2 + 20);
});

test("inflation: 10 years of Romanian CPI → ~5.2% a year, ~2.2% real growth", () => {
  assert.ok(Math.abs(INFLATION_10Y_AVERAGE - 0.052) < 0.001);
  assert.ok(Math.abs(REAL_RETURN_AFTER_INFLATION - 0.022) < 0.001);
});

test("daysAtRetirement: savings grow until 65 (after inflation), then pay for days", () => {
  const income = projectedRetirementIncome({ age: 34, netSalaryBani: 650000, yearsWorked: 12, pillarTwoBani: 0, pillarThreeBani: 0 });
  // 31 years at ~2.2% real ≈ ×1.96
  assert.ok(income.growthToRetirement > 1.9 && income.growthToRetirement < 2.0);
  const today = daysOfFreedomFromSalary(4200000, 650000).base; // 1156 days in today's money, no growth
  const at65 = daysAtRetirement(4200000, 650000, income);
  assert.ok(at65 > today * 1.9 && at65 < today * 2.0);
  // At 64 there is almost no time left to grow.
  const late = projectedRetirementIncome({ age: 64, netSalaryBani: 650000, yearsWorked: 40, pillarTwoBani: 0, pillarThreeBani: 0 });
  assert.ok(late.growthToRetirement < 1.03);
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

test("profileError: rejects the inputs that made the reveal illogical", () => {
  const ok = { birthYear: 1992, netSalaryBani: 650000, yearsWorked: 12 };
  assert.strictEqual(profileError(ok, 2026), null);
  assert.strictEqual(profileError({ ...ok, netSalaryBani: 100 }, 2026)?.field, "netSalaryBani"); // 1 RON
  assert.strictEqual(profileError({ ...ok, netSalaryBani: 199999 }, 2026)?.field, "netSalaryBani");
  assert.strictEqual(profileError({ ...ok, netSalaryBani: 200000 }, 2026), null); // the 2,000 RON floor
  assert.strictEqual(profileError({ ...ok, birthYear: 1961 }, 2026)?.field, "birthYear"); // 65, already retired
  assert.strictEqual(profileError({ ...ok, birthYear: 2009 }, 2026)?.field, "birthYear"); // 17
  assert.strictEqual(profileError({ ...ok, yearsWorked: 19 }, 2026)?.field, "yearsWorked"); // 34 − 16 = 18 max
  assert.strictEqual(profileError({ ...ok, yearsWorked: 18 }, 2026), null);
});

test("formatRatio and formatFreedom: capped so a typo can't show absurd numbers", () => {
  assert.strictEqual(formatRatio(0.742), "74%");
  assert.strictEqual(formatRatio(411.61), "more than 150%");
  assert.strictEqual(formatFreedom(15 * 365), "15 years");
  assert.strictEqual(formatFreedom(15 * 365 + 1), "15+ years");
});

test("days of freedom use the same state pension as the income projection", () => {
  // 55 years old, 5 years worked: only 15 of 35 contribution years → a smaller state pension.
  const income = projectedRetirementIncome({ age: 55, netSalaryBani: 650000, yearsWorked: 5, pillarTwoBani: 0, pillarThreeBani: 0 });
  assert.ok(Math.abs(income.stateReplacementRate - 0.48 * (15 / 35)) < 1e-9);
  assert.strictEqual(income.statePensionBani, Math.round(650000 * income.stateReplacementRate));
  // A bigger gap to cover → the same savings buy fewer days than with the flat 48%.
  const own = daysOfFreedomFromSalary(4200000, 650000, income.stateReplacementRate).base;
  const flat = daysOfFreedomFromSalary(4200000, 650000).base;
  assert.ok(own < flat);
});
