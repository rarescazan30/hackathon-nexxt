import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_USER_CONTEXT,
  executeCalculateProjection,
  executeChangeRiskAllocation,
  executeExplainNumber,
  executeUpdateRoundUpRule,
  parseRoundUpIntent,
  runAgent,
  searchKnowledge,
} from "../index";

test("parseRoundUpIntent: distinguishes between What-If simulation vs Applied action", () => {
  // 1. Simulated ("Ce-ar fi dacă...")
  const sim10 = parseRoundUpIntent("Ce-ar fi dacă rotunjesc la 10 lei?");
  assert.strictEqual(sim10.matched, true);
  assert.strictEqual(sim10.mode, "simulated");
  assert.deepStrictEqual(sim10.rule, { stepBani: 1000, multiplier: 1 });

  // 2. Applied ("Setează...")
  const apply10 = parseRoundUpIntent("Setează rotunjirea la 10 lei");
  assert.strictEqual(apply10.matched, true);
  assert.strictEqual(apply10.mode, "applied");
  assert.deepStrictEqual(apply10.rule, { stepBani: 1000, multiplier: 1 });

  const pct20 = parseRoundUpIntent("Setează 20% round-up la plăți");
  assert.strictEqual(pct20.matched, true);
  assert.strictEqual(pct20.mode, "applied");
  assert.deepStrictEqual(pct20.rule, { percentage: 20, roundTo: "lei", multiplier: 1 });

  const pct1 = parseRoundUpIntent("vreau sa schimb roundup la 1%");
  assert.strictEqual(pct1.matched, true);
  assert.strictEqual(pct1.mode, "applied");
  assert.deepStrictEqual(pct1.rule, { percentage: 1, roundTo: "bani", multiplier: 1 });

  const customTotal = parseRoundUpIntent("Pentru 12,30 lei vreau să plătesc 15 lei");
  assert.strictEqual(customTotal.matched, true);
  assert.deepStrictEqual(customTotal.rule, { chosenTotalBani: 1500 });
  assert.strictEqual(customTotal.sampleAmountBani, 1230);
});

test("executeUpdateRoundUpRule: computes exact integer bani round-ups via lib/rules", () => {
  const baseline = executeUpdateRoundUpRule(DEFAULT_USER_CONTEXT.roundUpRule, DEFAULT_USER_CONTEXT);
  assert.strictEqual(baseline.estimatedMonthlyRoundUpsBani, 7400); // 74.00 lei
  assert.strictEqual(baseline.newMonthlyTotalBani, 20900); // 209.00 lei (74 + 135)
  assert.strictEqual(baseline.sampleTransactions[0].spentBani, 1230);
  assert.strictEqual(baseline.sampleTransactions[0].roundUpBani, 270); // 12.30 -> 15.00 (+2.70 lei)

  const step10 = executeUpdateRoundUpRule({ stepBani: 1000, multiplier: 1 }, DEFAULT_USER_CONTEXT);
  assert.strictEqual(step10.sampleTransactions[0].roundUpBani, 770);
  assert.strictEqual(step10.sampleTransactions[0].totalToPayBani, 2000);
});

test("runAgent: simulated round-up does not mutate state, applied round-up mutates state, and explains previous numbers", async () => {
  // 1a. Simulated round-up ("Ce-ar fi dacă...") -> does NOT mutate updatedContext
  const simRes = await runAgent({ message: "Ce-ar fi dacă rotunjesc la 10 lei?" });
  assert.strictEqual(simRes.toolResult?.kind, "roundup_updated");
  if (simRes.toolResult?.kind === "roundup_updated") {
    assert.strictEqual(simRes.toolResult.mode, "simulated");
  }
  assert.strictEqual(simRes.updatedContext.roundUpRule.stepBani, 500); // Still 500 (unchanged!)

  // 1b. Applied round-up ("Setează...") -> DOES mutate updatedContext
  const applyRes = await runAgent({ message: "Setează rotunjirea la 10 lei" });
  assert.strictEqual(applyRes.toolResult?.kind, "roundup_updated");
  if (applyRes.toolResult?.kind === "roundup_updated") {
    assert.strictEqual(applyRes.toolResult.mode, "applied");
  }
  assert.strictEqual(applyRes.updatedContext.roundUpRule.stepBani, 1000); // Now 1000!

  // 2. What-if projection followed by asking about the number from the previous prompt
  const projRes = await runAgent({ message: "Ce se întâmplă dacă adaug 200 lei/lună?" });
  assert.strictEqual(projRes.toolResult?.kind, "projection_calculated");

  const explainPrev = await runAgent({
    message: "Cum ai calculat cifra de mai sus?",
    lastToolResult: projRes.toolResult,
  });
  assert.strictEqual(explainPrev.toolResult?.kind, "number_explained");
  if (explainPrev.toolResult?.kind === "number_explained" && projRes.toolResult?.kind === "projection_calculated") {
    assert.ok(
      explainPrev.toolResult.targetNumberLabel.includes(
        String(projRes.toolResult.projectedDaysOfFreedom.base)
      )
    );
  }

  // 3. Explain 209 lei vs 326 zile
  const explain209 = await runAgent({ message: "De unde vine 209 lei?" });
  assert.strictEqual(explain209.toolResult?.kind, "number_explained");
  if (explain209.toolResult?.kind === "number_explained") {
    assert.ok(explain209.toolResult.targetNumberLabel.includes("209,00 lei"));
  }

  const explain326 = await runAgent({ message: "De unde vine cifra 326?" });
  assert.strictEqual(explain326.toolResult?.kind, "number_explained");
  if (explain326.toolResult?.kind === "number_explained") {
    assert.strictEqual(explain326.toolResult.currentDays.base, 326);
  }
});

test("executeExplainNumber & executeCalculateProjection & executeChangeRiskAllocation conservation", () => {
  const explain = executeExplainNumber(DEFAULT_USER_CONTEXT, "326");
  assert.strictEqual(explain.currentDays.base, 326);

  const alloc = executeChangeRiskAllocation("high", DEFAULT_USER_CONTEXT);
  const sumParts =
    alloc.allocation.products.pillar3Bani +
    alloc.allocation.products.etfBetBani +
    alloc.allocation.products.govBondsBani;
  assert.strictEqual(sumParts, alloc.monthlyTotalBani);

  const proj = executeCalculateProjection({ extraMonthlyBani: 15000, years: 10 }, DEFAULT_USER_CONTEXT);
  assert.ok(proj.projectedPortfolioBani.optimistic > proj.projectedPortfolioBani.base);
  assert.ok(proj.projectedPortfolioBani.base > proj.projectedPortfolioBani.pessimistic);

  const chunks = searchKnowledge("Titluri de stat Fidelis");
  assert.ok(chunks.some((c) => c.sourceTitle.includes("Ministerul Finanțelor")));
});
