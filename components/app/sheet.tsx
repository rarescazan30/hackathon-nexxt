'use client'

// The pop-up sheet used for money steps: the Stripe card form, Open Banking and
// "add a card first". One design everywhere: white sheet, purple accents.
import { Lock, X } from 'lucide-react'

export function Sheet({
  eyebrow,
  title,
  note,
  onClose,
  children,
}: {
  eyebrow: string
  title: string
  /** Small line at the bottom, e.g. "Secured by Stripe · test mode". */
  note?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18151f]/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-[430px] rounded-t-[28px] bg-white p-6 pb-[calc(24px+env(safe-area-inset-bottom))] text-[#292431] shadow-2xl animate-in slide-in-from-bottom-8 duration-300 sm:rounded-[28px]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">{eyebrow}</p>
            <h2 className="text-xl font-semibold tracking-[-.02em]">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f1effa]">
            <X size={16} />
          </button>
        </div>
        {children}
        {note && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#858090]">
            <Lock size={12} /> {note}
          </p>
        )}
      </div>
    </div>
  )
}

// Fixed light colours for fields inside a sheet (the sheet is always light).
export const SHEET_INPUT = 'w-full rounded-xl border border-[#e2dfe8] bg-[#f7f6f9] px-3.5 py-3 text-base text-[#292431] outline-none focus:border-[#6f5cc1]'
export const SHEET_LABEL = 'mb-1.5 block text-xs font-medium text-[#706b7b]'
