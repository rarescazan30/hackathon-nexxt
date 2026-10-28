'use client'

// Full-screen level-up moment: the slot that changed pops in with sparkles.
// Closing it records the level as seen, so it plays once.
import { useState, useTransition } from 'react'
import type { Slot, SlotTiers } from '@/lib/rules/lifestyle'
import { markLevelSeen } from '@/app/app/actions'
import { LifestyleScene, slotLabel } from '@/components/scene'

export function LevelUpOverlay({ level, slot, slots, isMilestone }: { level: number; slot: Slot; slots: SlotTiers; isMilestone: boolean }) {
  const [open, setOpen] = useState(true)
  const [pending, startTransition] = useTransition()
  if (!open) return null

  const close = () =>
    startTransition(async () => {
      await markLevelSeen(level)
      setOpen(false)
    })

  return (
    <div role="dialog" aria-modal="true" aria-label={`Level ${level}`} className="fixed inset-0 z-50 flex items-center justify-center bg-[#18151f]/70 p-5 backdrop-blur-sm">
      <div className="w-full max-w-[390px] overflow-hidden rounded-[28px] bg-white text-center shadow-2xl dark:bg-[#211d2b]">
        <div className="bg-gradient-to-b from-[#e8e2fb] to-white dark:from-[#2b253a] dark:to-[#211d2b]">
          <LifestyleScene slots={slots} highlight={slot} />
        </div>
        <div className="px-6 pb-6">
          <p className="text-[11px] font-medium uppercase tracking-[.18em] text-[#8c7ad9]">{isMilestone ? 'New lifestyle unlocked' : 'Level up'}</p>
          <h2 className="mt-1 text-[30px] font-semibold tracking-[-.04em]">Level {level}</h2>
          <p className="mt-2 text-sm text-[#706b7b] dark:text-[#aaa4b6]">
            Your retirement now comes with <b className="text-[#292431] dark:text-white">{slotLabel(slot, slots[slot]).toLowerCase()}</b>.
          </p>
          <button onClick={close} disabled={pending} className="mt-5 w-full rounded-xl bg-[#33256c] py-3 text-sm font-semibold text-white disabled:opacity-60">
            Nice!
          </button>
        </div>
      </div>
    </div>
  )
}
