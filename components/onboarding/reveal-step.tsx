'use client'

// Step 3, the hook: "If you retired today, this is how you'd live."
import { SLOTS, formatFreedom, formatRon } from '@/lib/rules/lifestyle'
import type { LifestyleNumbers } from '@/lib/data/lifestyle-state'
import { Card } from '@/components/app/shell'
import { LifestyleScene, SLOT_NAMES, slotLabel } from '@/components/scene'
import { PRIMARY_BUTTON } from './onboarding-state'

export function RevealStep({ numbers, onNext }: { numbers: LifestyleNumbers; onNext: () => void }) {
  const { level, income, totalDays } = numbers
  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden p-0">
        <LifestyleScene slots={level.slots} />
        <div className="grid grid-cols-2 gap-2 px-5 pb-5">
          {SLOTS.map((slot) => (
            <div key={slot} className="rounded-2xl bg-[#f7f6f9] px-3 py-2 dark:bg-[#2b253a]">
              <p className="text-[10px] font-medium uppercase tracking-[.14em] text-[#8c7ad9]">{SLOT_NAMES[slot]}</p>
              <p className="text-sm font-semibold">{slotLabel(slot, level.slots[slot])}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[#706b7b] dark:text-[#aaa4b6]">Expected income at 65</span>
          <b>{formatRon(income.totalMonthlyBani, { wholeRon: true })}/mo</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[#706b7b] dark:text-[#aaa4b6]">Compared to your life today</span>
          <b>{Math.round(income.replacementRatio * 100)}%</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[#706b7b] dark:text-[#aaa4b6]">Days of freedom you already have</span>
          <b>{formatFreedom(totalDays)}</b>
        </div>
        <p className="border-t border-dashed border-[#e2dfe8] pt-3 text-xs text-[#96909f] dark:border-[#353042]">
          A cautious estimate in today&rsquo;s money: state pension + Pillar II + Pillar III. Education, not investment advice.
        </p>
      </Card>

      <button onClick={onNext} className={PRIMARY_BUTTON}>
        Let&rsquo;s make it better
      </button>
    </div>
  )
}
