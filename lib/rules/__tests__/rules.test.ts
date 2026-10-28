import test from "node:test";
import assert from "node:assert/strict";

import {
  parseDecimalStringToBani,
  formatBaniToLei,
  roundUp,
  getPaymentRoundUpOptions,
  calculatePaymentTotal,
  calculatePsd2RoundUp,
  jarTotal,
  allocate,
  project,
  projectRange,
  generateProjectionTimeline,
  calculateRetirementGap,
  daysOfFreedom,
  daysOfFreedomFromSalary,
  daysAddedFromAmount,
  REAL_RETURN_RATES,
} from "../index";

test("parseDecimalStringToBani: parses amounts without float errors", () => {
  assert.strictEqual(parseDecimalStringToBani("12.30"), 1230);
  assert.strictEqual(parseDecimalStringToBani("-12.30"), -1230);
  assert.strictEqual(parseDecimalStringToBani("86.40"), 8640);
  assert.strictEqual(parseDecimalStringToBani("-86.40"), -8640);
  assert.strictEqual(parseDecimalStringToBani("0.05"), 5);
  assert.strictEqual(parseDecimalStringToBani("-0.05"), -5);
  assert.strictEqual(parseDecimalStringToBani("100"), 10000);
  assert.strictEqual(parseDecimalStringToBani("-100"), -10000);
  assert.strictEqual(parseDecimalStringToBani("12,30"), 1230);
});

test("formatBaniToLei: formats to Romanian currency display", () => {
  assert.strictEqual(formatBaniToLei(1230), "12,30 lei");
  assert.strictEqual(formatBaniToLei(8640), "86,40 lei");
  assert.strictEqual(formatBaniToLei(5), "0,05 lei");
  assert.strictEqual(formatBaniToLei(450000), "4.500,00 lei");
  assert.strictEqual(formatBaniToLei(-270), "-2,70 lei");
});

test("roundUp: accurately computes round-ups for various steps and multipliers", () => {
  // Coffee: 12.30 lei (1230 bani) -> nearest 5 lei (1500 bani) -> +2.70 lei (270 bani)
  assert.strictEqual(roundUp(1230), 270);

  // Groceries: 86.40 lei (8640 bani) -> nearest 5 lei (9000 bani) -> +3.60 lei (360 bani)
  assert.strictEqual(roundUp(8640), 360);

  // Exact multiple: 15.00 lei (1500 bani) -> 0 round-up
  assert.strictEqual(roundUp(1500), 0);
  assert.strictEqual(roundUp(2500), 0);

  // 1 leu step (100 bani): 1230 bani -> nearest 1300 bani -> 70 bani
  assert.strictEqual(roundUp(1230, { stepBani: 100 }), 70);

  // 10 lei step (1000 bani): 8640 bani -> nearest 9000 bani -> 360 bani
  assert.strictEqual(roundUp(8640, { stepBani: 1000 }), 360);

  // Multipliers: 2x multiplier
  assert.strictEqual(roundUp(1230, { stepBani: 500, multiplier: 2 }), 540);
  assert.strictEqual(roundUp(1230, { stepBani: 500, multiplier: 5 }), 1350);

  // Edge cases: non-positive amounts
  assert.strictEqual(roundUp(0), 0);
  assert.strictEqual(roundUp(-500), 0);
});

test("roundUp: client chooses total sum to be paid (original + 10%, 20%, 30% rounded to integer Lei)", () => {
  // Coffee: 12.30 lei (1230 bani)
  // 10% on top: 12.30 + 10% = 13.53 lei -> client chooses to pay 14.00 lei (+1.70 lei round-up)
  assert.strictEqual(roundUp(1230, { percentage: 10 }), 170);
  // 20% on top: 12.30 + 20% = 14.76 lei -> client chooses to pay 15.00 lei (+2.70 lei round-up)
  assert.strictEqual(roundUp(1230, { percentage: 20 }), 270);
  // 30% on top: 12.30 + 30% = 15.99 lei -> client chooses to pay 16.00 lei (+3.70 lei round-up)
  assert.strictEqual(roundUp(1230, { percentage: 30 }), 370);

  // Groceries: 86.40 lei (8640 bani)
  // 10% on top: 86.40 + 10% = 95.04 lei -> client chooses to pay 95.00 lei (+8.60 lei round-up)
  assert.strictEqual(roundUp(8640, { percentage: 10 }), 860);
  // 20% on top: 86.40 + 20% = 103.68 lei -> client chooses to pay 104.00 lei (+17.60 lei round-up)
  assert.strictEqual(roundUp(8640, { percentage: 20 }), 1760);
  // 30% on top: 86.40 + 30% = 112.32 lei -> client chooses to pay 112.00 lei (+25.60 lei round-up)
  assert.strictEqual(roundUp(8640, { percentage: 30 }), 2560);

  // Direct number shorthand (10, 20, 30)
  assert.strictEqual(roundUp(1230, 10), 170);
  assert.strictEqual(roundUp(1230, 20), 270);
  assert.strictEqual(roundUp(8640, 30), 2560);

  // Directly chosen total sum to be paid (chosenTotalBani)
  // Coffee 12.30 lei, customer taps "Pay 15.00 lei" -> 2.70 lei round-up
  assert.strictEqual(roundUp(1230, { chosenTotalBani: 1500 }), 270);
  // Groceries 86.40 lei, customer taps "Pay 100.00 lei" -> 13.60 lei round-up
  assert.strictEqual(roundUp(8640, { chosenTotalBani: 10000 }), 1360);

  // Integer bani rounding mode (roundTo: "bani")
  // 10% of 1230 bani = 123 bani
  assert.strictEqual(roundUp(1230, { percentage: 10, roundTo: "bani" }), 123);
  assert.strictEqual(roundUp(1230, { percentage: 20, roundTo: "bani" }), 246);
  assert.strictEqual(roundUp(1230, { percentage: 30, roundTo: "bani" }), 369);
});

test("getPaymentRoundUpOptions & calculatePaymentTotal: generates options to choose total to pay", () => {
  // Coffee: 12.30 lei
  const options = getPaymentRoundUpOptions(1230);
  assert.strictEqual(options.length, 3);

  // Option 10%: pay 14.00 lei (+1.70 lei round-up)
  assert.strictEqual(options[0].percentage, 10);
  assert.strictEqual(options[0].totalToPayBani, 1400);
  assert.strictEqual(options[0].roundUpBani, 170);
  assert.strictEqual(options[0].totalToPayFormatted, "14,00 lei");
  assert.strictEqual(options[0].roundUpFormatted, "+1,70 lei");

  // Option 20%: pay 15.00 lei (+2.70 lei round-up)
  assert.strictEqual(options[1].percentage, 20);
  assert.strictEqual(options[1].totalToPayBani, 1500);
  assert.strictEqual(options[1].roundUpBani, 270);
  assert.strictEqual(options[1].totalToPayFormatted, "15,00 lei");
  assert.strictEqual(options[1].roundUpFormatted, "+2,70 lei");

  // Option 30%: pay 16.00 lei (+3.70 lei round-up)
  assert.strictEqual(options[2].percentage, 30);
  assert.strictEqual(options[2].totalToPayBani, 1600);
  assert.strictEqual(options[2].roundUpBani, 370);
  assert.strictEqual(options[2].totalToPayFormatted, "16,00 lei");
  assert.strictEqual(options[2].roundUpFormatted, "+3,70 lei");

  // calculatePaymentTotal helper
  const totalDetails = calculatePaymentTotal(1230, { percentage: 20 });
  assert.strictEqual(totalDetails.spentBani, 1230);
  assert.strictEqual(totalDetails.roundUpBani, 270);
  assert.strictEqual(totalDetails.totalToPayBani, 1500);
  assert.strictEqual(totalDetails.spentFormatted, "12,30 lei");
  assert.strictEqual(totalDetails.totalToPayFormatted, "15,00 lei");
  assert.strictEqual(totalDetails.roundUpFormatted, "+2,70 lei");
});

test("calculatePsd2RoundUp: processes PSD2 expenses and ignores income", () => {
  const expenseTx = {
    transactionId: "tx-coffee",
    bookingDate: "2026-10-28",
    transactionAmount: { amount: "-12.30", currency: "RON" },
  };
  const result = calculatePsd2RoundUp(expenseTx);
  assert.ok(result);
  assert.strictEqual(result.transactionId, "tx-coffee");
  assert.strictEqual(result.spentBani, 1230);
  assert.strictEqual(result.roundUpBani, 270);

  const salaryTx = {
    transactionId: "tx-salary",
    bookingDate: "2026-10-15",
    transactionAmount: { amount: "4500.00", currency: "RON" },
  };
  const salaryResult = calculatePsd2RoundUp(salaryTx);
  assert.strictEqual(salaryResult, null);
});

test("jarTotal: sums round-ups and enforces optional monthly cap", () => {
  const items = [270, 360, 0, 450];
  assert.strictEqual(jarTotal(items), 1080);

  const objectItems = [
    { roundUpBani: 270 },
    { roundUpBani: 360 },
    { roundUpBani: 450 },
  ];
  assert.strictEqual(jarTotal(objectItems), 1080);

  // Cap at 1000 bani (10.00 lei)
  assert.strictEqual(jarTotal(items, 1000), 1000);

  // Cap larger than sum
  assert.strictEqual(jarTotal(items, 2000), 1080);
});

test("allocate: allocates funds strictly conserving total integer bani", () => {
  const testAmounts = [0, 1, 2, 7, 100, 101, 20900, 450000, 999999];
  const riskLevels: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];

  for (const risk of riskLevels) {
    for (const amount of testAmounts) {
      const res = allocate(amount, risk);
      const sum =
        res.products.govBondsBani +
        res.products.pillar3Bani +
        res.products.etfBetBani;

      // Invariant: sum must strictly equal amount down to the single ban
      assert.strictEqual(
        sum,
        amount,
        `Allocation sum mismatch for risk=${risk}, amount=${amount}: sum=${sum}`
      );
      assert.ok(res.products.govBondsBani >= 0);
      assert.ok(res.products.pillar3Bani >= 0);
      assert.ok(res.products.etfBetBani >= 0);
    }
  }

  // Specific risk weight checks:
  // Low risk: 75% Gov Bonds, 25% Pillar 3, 0% ETF BET
  const lowRes = allocate(10000, "low"); // 100 lei
  assert.strictEqual(lowRes.products.govBondsBani, 7500);
  assert.strictEqual(lowRes.products.pillar3Bani, 2500);
  assert.strictEqual(lowRes.products.etfBetBani, 0);

  // Medium risk: 50% Pillar 3, 35% ETF BET, 15% Gov Bonds
  const medRes = allocate(20900, "medium"); // 209 lei
  assert.strictEqual(medRes.products.pillar3Bani, 10450); // 50%
  assert.strictEqual(medRes.products.etfBetBani, 7315);   // 35%
  assert.strictEqual(medRes.products.govBondsBani, 3135); // 15%

  // High risk: 65% ETF BET, 25% Pillar 3, 10% Gov Bonds
  const highRes = allocate(10000, "high");
  assert.strictEqual(highRes.products.etfBetBani, 6500);
  assert.strictEqual(highRes.products.pillar3Bani, 2500);
  assert.strictEqual(highRes.products.govBondsBani, 1000);
});

test("project: compound growth calculation", () => {
  // 0 years -> returns initial
  assert.strictEqual(project(10000, 500, 0, 0.05), 10000);

  // 0% return -> simple sum of initial + contributions
  // 1 year, 1000 bani monthly deposit
  assert.strictEqual(project(10000, 1000, 1, 0), 22000);

  // Monotonic growth with positive real return
  const fvPessimistic = project(10000, 1000, 10, REAL_RETURN_RATES.pessimistic);
  const fvBase = project(10000, 1000, 10, REAL_RETURN_RATES.base);
  const fvOptimistic = project(10000, 1000, 10, REAL_RETURN_RATES.optimistic);

  assert.ok(fvPessimistic < fvBase, "Pessimistic should be lower than base");
  assert.ok(fvBase < fvOptimistic, "Base should be lower than optimistic");
});

test("projectRange and generateProjectionTimeline: produces ordered bands", () => {
  const bands = projectRange(820000, 20900, 20);
  assert.ok(bands.pessimistic <= bands.base);
  assert.ok(bands.base <= bands.optimistic);

  const timeline = generateProjectionTimeline({
    currentAge: 26,
    retirementAge: 65,
    initialPortfolioBani: 820000,
    monthlyContributionBani: 20900,
    stepYears: 3,
  });

  assert.ok(timeline.length > 5);
  assert.strictEqual(timeline[0].age, 26);
  assert.strictEqual(timeline[timeline.length - 1].age, 65);

  // Check monotonicity over time
  for (let i = 1; i < timeline.length; i++) {
    assert.ok(timeline[i].baseBani > timeline[i - 1].baseBani);
  }
});

test("calculateRetirementGap & daysOfFreedom: matches Romanian pension model", () => {
  // Andrei: 4500 lei salary (450000 bani)
  const gap = calculateRetirementGap(450000);
  // Target: 4500 * 0.65 = 2925 lei
  assert.strictEqual(gap.targetMonthlySpendingBani, 292500);
  // Pillar 1: 4500 * 0.48 = 2160 lei
  assert.strictEqual(gap.statePensionMonthlyBani, 216000);
  // Monthly gap: 765 lei
  assert.strictEqual(gap.monthlyGapBani, 76500);
  // Daily gap: 765 / 30.4167 = 25.15 lei -> 2515 bani
  assert.strictEqual(gap.dailyGapBani, 2515);

  // Andrei has 8200 lei in Pillar 2:
  const freedom = daysOfFreedomFromSalary(820000, 450000);
  assert.strictEqual(freedom.base, 326);
  assert.strictEqual(freedom.pessimistic, 290);
  assert.strictEqual(freedom.optimistic, 370);

  // Edge cases
  const zeroFreedom = daysOfFreedom(0);
  assert.strictEqual(zeroFreedom.base, 0);
  assert.strictEqual(zeroFreedom.pessimistic, 0);
  assert.strictEqual(zeroFreedom.optimistic, 0);

  // Additional investment days added
  const added = daysAddedFromAmount(20900, 450000);
  assert.strictEqual(added.base, 8);
});
