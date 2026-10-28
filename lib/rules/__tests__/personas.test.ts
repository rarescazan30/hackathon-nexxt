import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  calculatePsd2RoundUp,
  jarTotal,
  allocate,
  daysOfFreedomFromSalary,
} from "../index";

interface PersonaData {
  id: string;
  name: string;
  age: number;
  yearsWorked: number;
  salaryBani: number;
  pillarTwoBani: number;
  risk: "low" | "medium" | "high";
  roundUpRule: {
    stepBani: number;
    multiplier: number;
  };
  monthlyCapBani?: number;
  expectedDaysOfFreedom: {
    pessimistic: number;
    base: number;
    optimistic: number;
  };
  sampleTransactions: Array<{
    transactionId: string;
    bookingDate: string;
    transactionAmount: {
      amount: string;
      currency: string;
    };
    creditorName?: string;
    remittanceInformationUnstructured?: string;
    expectedSpentBani: number;
    expectedRoundUpBani: number;
  }>;
}

function loadPersona(id: string): PersonaData {
  const filePath = path.resolve(process.cwd(), "data/personas", `${id}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

test("Persona Andrei: verifies round-ups, jar total, allocation, and days of freedom", () => {
  const andrei = loadPersona("andrei");

  // 1. Transactions and round-ups
  const roundups: number[] = [];
  for (const tx of andrei.sampleTransactions) {
    const res = calculatePsd2RoundUp(tx, andrei.roundUpRule);
    if (tx.expectedRoundUpBani > 0) {
      assert.ok(res, `Expected round-up for tx ${tx.transactionId}`);
      assert.strictEqual(res.spentBani, tx.expectedSpentBani);
      assert.strictEqual(res.roundUpBani, tx.expectedRoundUpBani);
      roundups.push(res.roundUpBani);
    } else {
      // Income or exact transaction produces 0 or null
      if (res) {
        assert.strictEqual(res.roundUpBani, 0);
      }
    }
  }

  // 2. Jar total
  const jar = jarTotal(roundups, andrei.monthlyCapBani);
  assert.strictEqual(jar, 630); // 270 (coffee) + 360 (groceries) = 630 bani (6.30 lei)

  // 3. Days of Freedom matches UI mock
  const freedom = daysOfFreedomFromSalary(andrei.pillarTwoBani, andrei.salaryBani);
  assert.strictEqual(freedom.base, andrei.expectedDaysOfFreedom.base);
  assert.strictEqual(freedom.pessimistic, andrei.expectedDaysOfFreedom.pessimistic);
  assert.strictEqual(freedom.optimistic, andrei.expectedDaysOfFreedom.optimistic);

  // 4. Monthly allocation (209 lei as in mock)
  const alloc = allocate(20900, andrei.risk);
  assert.strictEqual(alloc.totalBani, 20900);
  assert.strictEqual(alloc.products.pillar3Bani, 10450); // 50%
  assert.strictEqual(alloc.products.etfBetBani, 7315);   // 35%
  assert.strictEqual(alloc.products.govBondsBani, 3135); // 15%
  assert.strictEqual(
    alloc.products.pillar3Bani + alloc.products.etfBetBani + alloc.products.govBondsBani,
    20900
  );
});

test("Persona Elena: verifies high-risk allocation and accelerated round-ups", () => {
  const elena = loadPersona("elena");

  const roundups: number[] = [];
  for (const tx of elena.sampleTransactions) {
    const res = calculatePsd2RoundUp(tx, elena.roundUpRule);
    assert.ok(res);
    assert.strictEqual(res.spentBani, tx.expectedSpentBani);
    assert.strictEqual(res.roundUpBani, tx.expectedRoundUpBani);
    roundups.push(res.roundUpBani);
  }

  // 960 + 1700 = 2660 bani (26.60 lei)
  const jar = jarTotal(roundups, elena.monthlyCapBani);
  assert.strictEqual(jar, 2660);

  // Days of freedom
  const freedom = daysOfFreedomFromSalary(elena.pillarTwoBani, elena.salaryBani);
  assert.strictEqual(freedom.base, elena.expectedDaysOfFreedom.base);
  assert.strictEqual(freedom.pessimistic, elena.expectedDaysOfFreedom.pessimistic);
  assert.strictEqual(freedom.optimistic, elena.expectedDaysOfFreedom.optimistic);

  // High risk allocation (65% ETF, 25% Pillar 3, 10% Gov bonds)
  const alloc = allocate(100000, elena.risk); // 1000 lei
  assert.strictEqual(alloc.products.etfBetBani, 65000);
  assert.strictEqual(alloc.products.pillar3Bani, 25000);
  assert.strictEqual(alloc.products.govBondsBani, 10000);
});

test("Persona Radu: verifies low-risk allocation and entry-level trajectory", () => {
  const radu = loadPersona("radu");

  const roundups: number[] = [];
  for (const tx of radu.sampleTransactions) {
    const res = calculatePsd2RoundUp(tx, radu.roundUpRule);
    assert.ok(res);
    assert.strictEqual(res.spentBani, tx.expectedSpentBani);
    assert.strictEqual(res.roundUpBani, tx.expectedRoundUpBani);
    roundups.push(res.roundUpBani);
  }

  const jar = jarTotal(roundups, radu.monthlyCapBani);
  assert.strictEqual(jar, 450); // 400 + 50 = 450 bani (4.50 lei)

  const freedom = daysOfFreedomFromSalary(radu.pillarTwoBani, radu.salaryBani);
  assert.strictEqual(freedom.base, radu.expectedDaysOfFreedom.base);
  assert.strictEqual(freedom.pessimistic, radu.expectedDaysOfFreedom.pessimistic);
  assert.strictEqual(freedom.optimistic, radu.expectedDaysOfFreedom.optimistic);

  // Low risk: 75% Gov bonds, 25% Pillar 3, 0% ETF
  const alloc = allocate(50000, radu.risk); // 500 lei
  assert.strictEqual(alloc.products.govBondsBani, 37500);
  assert.strictEqual(alloc.products.pillar3Bani, 12500);
  assert.strictEqual(alloc.products.etfBetBani, 0);
});

