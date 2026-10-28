'use client'

// The landing page scene: walks through the tiers so visitors see the whole journey.
import { useEffect, useState } from 'react'
import { slotsAtLevel, slotUnlockedAt } from '@/lib/rules/lifestyle'
import { LifestyleScene } from '@/components/scene'

const TOUR_LEVELS = [1, 5, 9, 13, 17, 20]
const STEP_MS = 2600
const TIER_NAMES = ['Tent life', 'A small flat', 'A family house', 'A modern house', 'The villa']

export function HeroScene() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % TOUR_LEVELS.length), STEP_MS)
    return () => window.clearInterval(timer)
  }, [])

  const level = TOUR_LEVELS[index]
  const tier = Math.ceil(level / 4)
  return (
    <div className="relative">
      <LifestyleScene slots={slotsAtLevel(level)} highlight={slotUnlockedAt(level)} />
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#5f4bb6] shadow-sm dark:bg-[#211d2b]/90 dark:text-[#a594f0]">
        Level {level} · {TIER_NAMES[tier - 1]}
      </span>
    </div>
  )
}
