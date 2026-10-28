'use client'

// "If we had N users": monthly and yearly interest from today's average contribution.
// N × average × acceptance rate × yearly rate ÷ 12, the same model as lib/rules/float.ts.
import { useState } from 'react'
import { FLOAT_INTEREST_RATE, formatRon } from '@/lib/rules'
import { Card } from '@/components/app/shell'

const USER_STEPS = [100, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000]
// Before we have real numbers, assume a 500 RON month and everyone saying yes.
const FALLBACK_AVERAGE_BANI = 50_000
const MONTHS_PER_YEAR = 12

export function RevenueProjection({ averageBani, acceptanceRate }: { averageBani: number; acceptanceRate: number }) {
  const [step, setStep] = useState(1)
  const users = USER_STEPS[step]
  const average = averageBani || FALLBACK_AVERAGE_BANI
  const rate = acceptanceRate || 1
  const monthlyBani = Math.round((users * average * rate * FLOAT_INTEREST_RATE) / MONTHS_PER_YEAR)

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Projection</p>
      <label htmlFor="users" className="mt-2 block text-sm">
        If we had <b className="tabular-nums">{users.toLocaleString('en-US')}</b> users
      </label>
      <input
        id="users"
        type="range"
        min={0}
        max={USER_STEPS.length - 1}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        className="mt-3 w-full accent-[#6f5cc1]"
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#f1effa] p-4 dark:bg-[#2b253a]">
          <p className="text-xs text-[#706b7b] dark:text-[#aaa4b6]">Per month</p>
          <p className="text-xl font-semibold tabular-nums">{formatRon(monthlyBani, { wholeRon: true })}</p>
        </div>
        <div className="rounded-2xl bg-[#f1effa] p-4 dark:bg-[#2b253a]">
          <p className="text-xs text-[#706b7b] dark:text-[#aaa4b6]">Per year</p>
          <p className="text-xl font-semibold tabular-nums">{formatRon(monthlyBani * MONTHS_PER_YEAR, { wholeRon: true })}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#858090] dark:text-[#a39cab]">
        {formatRon(average, { wholeRon: true })} average a month{averageBani ? '' : ' (assumed)'} ×{' '}
        {Math.round(rate * 100)}% saying yes{acceptanceRate ? '' : ' (assumed)'} × {FLOAT_INTEREST_RATE * 100}% a year ÷ 12.
      </p>
    </Card>
  )
}
