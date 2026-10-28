'use client'

// The days-of-freedom number counts up from 0 like calendar pages flipping fast:
// days → months → years, quick at first, slowing down as it lands on the real value.
import { useEffect, useState } from 'react'
import { formatFreedom } from '@/lib/rules/lifestyle'

const DURATION_MS = 1200

/** Fast start, soft landing. */
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Once per visit: switching tabs and back shows the number straight away.
let alreadyPlayed = false

export function CountUpFreedom({ days }: { days: number }) {
  const [shown, setShown] = useState(alreadyPlayed ? days : 0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animate = !alreadyPlayed && !reducedMotion
    alreadyPlayed = true
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = animate ? (now - start) / DURATION_MS : 1
      setShown(Math.round(days * easeOutExpo(t)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [days])

  // tabular-nums keeps the digits from jumping sideways while they change.
  return <span className="tabular-nums">{formatFreedom(shown)}</span>
}
