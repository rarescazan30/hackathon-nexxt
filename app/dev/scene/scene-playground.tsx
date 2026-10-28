'use client'

// Sliders for every slot, to build and check the 3D models without the rest of the app.
import { useState } from 'react'
import { SLOTS, levelState, slotUnlockedAt, type Slot, type SlotTiers } from '@/lib/rules/lifestyle'
import { Card } from '@/components/app/shell'
import { LifestyleScene, SLOT_NAMES, slotLabel } from '@/components/scene'

export function ScenePlayground() {
  const [slots, setSlots] = useState<SlotTiers>({ home: 3, transport: 3, food: 2, extras: 2 })
  const [highlight, setHighlight] = useState<Slot | null>(null)
  const [level, setLevel] = useState(10)

  function setTier(slot: Slot, tier: number) {
    setSlots((prev) => ({ ...prev, [slot]: tier }))
    setHighlight(slot)
  }

  function goToLevel(next: number) {
    setLevel(next)
    setSlots(levelState(next, 0).slots)
    setHighlight(slotUnlockedAt(next))
  }

  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-5 py-6">
        <header className="px-1">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Dev only</p>
          <h1 className="text-[27px] font-semibold tracking-[-.04em]">Scene playground</h1>
        </header>

        <Card className="overflow-hidden p-0">
          <LifestyleScene slots={slots} highlight={highlight} />
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-medium text-[#858090] dark:text-[#a39cab]">
              <label htmlFor="level">Level (levels up one slot at a time)</label>
              <span>{level}</span>
            </div>
            <input id="level" type="range" min={1} max={20} value={level} onChange={(e) => goToLevel(Number(e.target.value))} className="w-full accent-[#6f5cc1]" />
          </div>
          {SLOTS.map((slot) => (
            <div key={slot}>
              <div className="mb-1.5 flex justify-between text-xs font-medium text-[#858090] dark:text-[#a39cab]">
                <label htmlFor={slot}>{SLOT_NAMES[slot]}</label>
                <span>
                  Tier {slots[slot]} · {slotLabel(slot, slots[slot])}
                </span>
              </div>
              <input id={slot} type="range" min={1} max={5} value={slots[slot]} onChange={(e) => setTier(slot, Number(e.target.value))} className="w-full accent-[#6f5cc1]" />
            </div>
          ))}
        </Card>
      </div>
    </main>
  )
}
