'use client'

// "Banca Demo": the fake bank screens that make the demo feel like a real PSD2 flow
// (docs/BANK_IMPLEMENTATION.md). Clearly labelled as a demo; nothing real is connected.
//   consent: pick an account, confirm with any 4-digit code → "card connected"
//   payment: confirm the month's transfer, like strong customer authentication (SCA)
import { useState } from 'react'
import { Check, Landmark, Lock, X } from 'lucide-react'

export const DEMO_ACCOUNT = {
  bank: 'Banca Demo',
  iban: 'RO49 DEMO 0000 1234 5678',
  card: 'Visa •• 4821',
}

const CODE_LENGTH = 4

type DemoBankProps =
  | { mode: 'consent'; onConfirm: () => void; onClose: () => void }
  | { mode: 'payment'; amount: string; onConfirm: () => void; onClose: () => void }

export function DemoBank(props: DemoBankProps) {
  const [step, setStep] = useState<'account' | 'code'>(props.mode === 'consent' ? 'account' : 'code')
  const [code, setCode] = useState('')
  const codeOk = new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18151f]/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={DEMO_ACCOUNT.bank}>
      <div className="w-full max-w-[430px] rounded-t-[28px] bg-white p-6 pb-[calc(24px+env(safe-area-inset-bottom))] text-[#1f2a37] shadow-2xl animate-in slide-in-from-bottom-8 duration-300 sm:rounded-[28px]">
        {/* A bank-looking header in its own colours, so it reads as "now you are at your bank". */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#0b6e4f] text-white">
              <Landmark size={18} />
            </span>
            <div>
              <p className="text-sm font-bold">{DEMO_ACCOUNT.bank}</p>
              <p className="text-xs text-[#6b7280]">Demo bank · not a real bank</p>
            </div>
          </div>
          <button onClick={props.onClose} aria-label="Cancel" className="flex size-9 items-center justify-center rounded-full bg-[#f3f4f6]">
            <X size={16} />
          </button>
        </div>

        {step === 'account' ? (
          <>
            <h2 className="mt-6 text-lg font-bold">zile. wants to read your card payments</h2>
            <p className="mt-1 text-sm text-[#6b7280]">Only to calculate round-ups. zile. can&rsquo;t move money without asking you each month.</p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-[#0b6e4f] bg-[#ecfdf5] p-4">
              <Check size={18} className="text-[#0b6e4f]" />
              <div className="text-sm">
                <p className="font-semibold">Current account · {DEMO_ACCOUNT.card}</p>
                <p className="text-xs text-[#6b7280]">{DEMO_ACCOUNT.iban}</p>
              </div>
            </div>
            <button onClick={() => setStep('code')} className="pulse-hover mt-5 w-full rounded-xl bg-[#0b6e4f] py-3 text-sm font-semibold text-white">
              Continue
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-6 text-lg font-bold">
              {props.mode === 'payment' ? `Confirm payment of ${props.amount}` : 'Confirm access'}
            </h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              {props.mode === 'payment'
                ? `From ${DEMO_ACCOUNT.iban} to the zile. partner account. It reaches your Pillar III in one month.`
                : 'Access lasts 180 days. You can remove it any time in your bank app.'}
            </p>
            <label className="mt-4 block text-xs font-medium text-[#6b7280]" htmlFor="bank-code">
              Code from your bank app (demo: any {CODE_LENGTH} digits)
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#d1d5db] px-3.5 focus-within:border-[#0b6e4f]">
              <Lock size={15} className="text-[#6b7280]" />
              <input
                id="bank-code"
                inputMode="numeric"
                autoComplete="off"
                maxLength={CODE_LENGTH}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-transparent py-3 text-base tracking-[.5em] outline-none"
                autoFocus
              />
            </div>
            <button onClick={props.onConfirm} disabled={!codeOk} className="pulse-hover mt-5 w-full rounded-xl bg-[#0b6e4f] py-3 text-sm font-semibold text-white disabled:opacity-50">
              {props.mode === 'payment' ? 'Confirm payment' : 'Allow access'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
