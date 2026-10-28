// Shown instead of the 3D scene when the device has no WebGL: the same information as icons.
import { Bike, House, Sprout, UtensilsCrossed } from 'lucide-react'
import { SLOTS, type SlotTiers } from '@/lib/rules/lifestyle'
import { SLOT_NAMES, slotLabel } from './slot-labels'

const ICONS = { home: House, transport: Bike, food: UtensilsCrossed, extras: Sprout }

export function SceneFallback({ slots }: { slots: SlotTiers }) {
  return (
    <div className="grid h-full grid-cols-2 gap-2 p-4">
      {SLOTS.map((slot) => {
        const Icon = ICONS[slot]
        return (
          <div key={slot} className="flex flex-col items-start gap-2 rounded-2xl bg-white/70 p-3 dark:bg-[#211d2b]/70">
            <Icon size={20} className="text-[#6f5cc1] dark:text-[#a594f0]" />
            <p className="text-[11px] font-medium uppercase tracking-[.14em] text-[#8c7ad9]">{SLOT_NAMES[slot]}</p>
            <p className="text-sm font-semibold">{slotLabel(slot, slots[slot])}</p>
          </div>
        )
      })}
    </div>
  )
}
