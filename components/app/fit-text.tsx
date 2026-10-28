'use client'

// Text that stays on one line: if it doesn't fit its box, the font gets smaller
// (down to `minPx`) instead of wrapping onto a second row.
import { useLayoutEffect, useRef, useState } from 'react'

export function FitText({ children, maxPx = 15, minPx = 11, className = '' }: { children: React.ReactNode; maxPx?: number; minPx?: number; className?: string }) {
  const box = useRef<HTMLSpanElement>(null)
  const text = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState(maxPx)

  useLayoutEffect(() => {
    if (!box.current || !text.current) return
    const fit = () => {
      if (!box.current || !text.current) return
      // Measure at full size, then scale down by how much it overflows.
      text.current.style.fontSize = `${maxPx}px`
      const ratio = box.current.clientWidth / text.current.scrollWidth
      const next = ratio >= 1 ? maxPx : Math.max(minPx, Math.floor(maxPx * ratio * 10) / 10)
      text.current.style.fontSize = `${next}px`
      setSize(next)
    }
    fit()
    // Refit when the box resizes or the text changes (e.g. the days counting up).
    const resize = new ResizeObserver(fit)
    resize.observe(box.current)
    const change = new MutationObserver(fit)
    change.observe(text.current, { characterData: true, childList: true, subtree: true })
    return () => {
      resize.disconnect()
      change.disconnect()
    }
  }, [maxPx, minPx, children])

  return (
    <span ref={box} className={`block min-w-0 overflow-hidden text-right ${className}`}>
      <span ref={text} className="whitespace-nowrap" style={{ fontSize: size }}>
        {children}
      </span>
    </span>
  )
}
