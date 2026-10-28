'use client'

// "Find out more" under the landing island: the details stay hidden until asked for,
// so the first screen is just the question, one line and the island.
import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function FindOutMore({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const details = useRef<HTMLDivElement>(null)

  function show() {
    setOpen(true)
    // Wait one frame so the section exists before scrolling to it.
    requestAnimationFrame(() => details.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <>
      {!open && (
        <button
          onClick={show}
          className="pulse-hover mx-auto mt-5 flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#33256c] shadow-[0_12px_35px_rgba(49,37,108,.08)] dark:bg-[#211d2b] dark:text-white"
        >
          Find out more <ChevronDown size={16} />
        </button>
      )}
      <div ref={details} className={open ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
        {children}
      </div>
    </>
  )
}
