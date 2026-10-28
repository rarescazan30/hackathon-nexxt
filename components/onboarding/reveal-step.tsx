'use client'

// Step 3, the hook: "If you retired today, this is how you'd live."
import { RO_INFLATION_BY_YEAR } from '@/lib/rules/config'
import { SLOTS, WELCOME_BONUS_XP, formatRatio, formatRon } from '@/lib/rules/lifestyle'
import type { LifestyleNumbers } from '@/lib/data/lifestyle-state'
import { Card } from '@/components/app/shell'
import { CountUpFreedom } from '@/components/app/count-up-freedom'
import { FitText } from '@/components/app/fit-text'
import { LifestyleScene, SLOT_NAMES, slotLabel } from '@/components/scene'
import { PRIMARY_BUTTON } from './onboarding-state'

// ~66: the total price rise over the years in the table (INS).
const INFLATION_10Y_RISE_PERCENT = Math.round(
  (Object.values(RO_INFLATION_BY_YEAR).reduce((factor, rate) => factor * (1 + rate), 1) - 1) * 100,
)

export function RevealStep({ numbers, onNext }: { numbers: LifestyleNumbers; onNext: () => void }) {
  const { level, income, totalDays } = numbers
  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden p-0">
        <LifestyleScene slots={level.slots} />
        <div className="grid grid-cols-2 gap-2 px-5 pb-5">
          {SLOTS.map((slot) => (
            <div key={slot} className="rounded-2xl bg-[#f7f6f9] px-3 py-2 dark:bg-[#2b253a]">
              <p className="text-xs font-medium uppercase tracking-[.14em] text-[#8c7ad9]">{SLOT_NAMES[slot]}</p>
              <p className="text-sm font-semibold">{slotLabel(slot, level.slots[slot])}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 text-sm">
        {/* The numbers never wrap: they shrink a little instead (FitText). */}
        <div className="grid grid-cols-[minmax(8.5rem,1fr)_minmax(0,max-content)] items-baseline gap-3">
          <span className="text-[#706b7b] dark:text-[#aaa4b6]">Expected income at 65</span>
          <FitText className="font-bold">{formatRon(income.totalMonthlyBani, { wholeRon: true })}/mo</FitText>
        </div>
        <div className="grid grid-cols-[minmax(8.5rem,1fr)_minmax(0,max-content)] items-baseline gap-3">
          <span className="text-[#706b7b] dark:text-[#aaa4b6]">Compared to your life today</span>
          <FitText className="font-bold">{formatRatio(income.replacementRatio)}</FitText>
        </div>
        <div className="grid grid-cols-[minmax(8.5rem,1fr)_minmax(0,max-content)] items-baseline gap-3">
          <span className="text-[#706b7b] dark:text-[#aaa4b6]">Days of freedom your savings buy at 65</span>
          <FitText className="font-bold">
            <CountUpFreedom days={totalDays} />
          </FitText>
        </div>
        <p className="border-t border-dashed border-[#e2dfe8] pt-3 text-xs text-[#96909f] dark:border-[#353042]">
          Prices in Romania rose {INFLATION_10Y_RISE_PERCENT}% in the last 10 years, so we only count growth above inflation. In
          today&rsquo;s money: state pension + Pillar II + Pillar III. Education, not investment advice.
        </p>
      </Card>

      <p className="flex items-center justify-center gap-1.5 rounded-xl bg-[#e3f5e9] px-3.5 py-2.5 text-center text-sm text-[#236243] dark:bg-[#1e3629] dark:text-[#bfe8d1]">
        Welcome bonus: <b>+{WELCOME_BONUS_XP} XP</b>. Your first month unlocks the next upgrade.
      </p>
      <button onClick={onNext} className={PRIMARY_BUTTON}>
        Let&rsquo;s make it better
      </button>
    </div>
  )
}
