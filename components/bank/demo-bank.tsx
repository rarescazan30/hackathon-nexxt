'use client'

// "Open Banking (demo)": the screens of a PSD2 bank connection, with fictional banks and
// data (docs/BANK_IMPLEMENTATION.md). Same look as the Stripe card sheet on purpose:
//   consent: pick your bank → pick the card you pay with → allow read access
//   payment: confirm the month's transfer (when no Stripe card is saved)
// Open Banking only READS payments (for round-ups). Paying is Stripe's job.
import { useState } from 'react'
import { Check, Eye, Landmark, Lock, X } from 'lucide-react'
import type { BankChoice } from '@/lib/server/profile-data'
import { PRIMARY_BUTTON } from '@/components/onboarding/onboarding-state'

export const OPEN_BANKING = 'Open Banking (demo)'

// Fictional banks: no real bank names or logos in the demo.
const BANKS = ['Demo Bank', 'Nova Bank', 'Danube Bank']
const CODE_LENGTH = 4

// Fixed light colours, like the Stripe card sheet.
const LIGHT_INPUT = 'w-full rounded-xl border border-[#e2dfe8] bg-[#f7f6f9] px-3.5 py-3 text-base text-[#292431] outline-none focus:border-[#6f5cc1]'
const LIGHT_LABEL = 'mb-1.5 block text-xs font-medium text-[#706b7b]'

type Props =
  | { mode: 'consent'; onConfirm: (choice: BankChoice) => void; onClose: () => void }
  | { mode: 'payment'; amount: string; onConfirm: () => void; onClose: () => void }

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18151f]/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={OPEN_BANKING}>
      <div className="w-full max-w-[430px] rounded-t-[28px] bg-white p-6 pb-[calc(24px+env(safe-area-inset-bottom))] text-[#292431] shadow-2xl animate-in slide-in-from-bottom-8 duration-300 sm:rounded-[28px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">{OPEN_BANKING}</p>
            <h2 className="text-xl font-semibold tracking-[-.02em]">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-full bg-[#f1effa]">
            <X size={16} />
          </button>
        </div>
        {children}
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#858090]">
          <Lock size={12} /> Demo bank connection · fictional data
        </p>
      </div>
    </div>
  )
}

function CodeField({ code, setCode }: { code: string; setCode: (code: string) => void }) {
  return (
    <div>
      <label className={LIGHT_LABEL} htmlFor="bank-code">
        Code from your bank app (demo: any {CODE_LENGTH} digits)
      </label>
      <input
        id="bank-code"
        inputMode="numeric"
        autoComplete="off"
        maxLength={CODE_LENGTH}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        className={`${LIGHT_INPUT} tracking-[.5em]`}
        autoFocus
      />
    </div>
  )
}

export function DemoBank(props: Props) {
  const [step, setStep] = useState<'bank' | 'card' | 'allow'>('bank')
  const [bankName, setBankName] = useState(BANKS[0])
  const [cardLast4, setCardLast4] = useState('')
  const [code, setCode] = useState('')
  const codeOk = code.length === CODE_LENGTH

  if (props.mode === 'payment') {
    return (
      <Sheet title={`Confirm payment of ${props.amount}`} onClose={props.onClose}>
        <p className="mb-4 text-sm leading-6 text-[#706b7b]">
          From your bank account to the LifeGrowth partner account. It reaches your Pillar III in one month.
        </p>
        <CodeField code={code} setCode={setCode} />
        <button onClick={props.onConfirm} disabled={!codeOk} className={`${PRIMARY_BUTTON} mt-4`}>
          Confirm payment
        </button>
      </Sheet>
    )
  }

  if (step === 'bank') {
    return (
      <Sheet title="Choose your bank" onClose={props.onClose}>
        <div className="flex flex-col gap-2">
          {BANKS.map((bank) => (
            <button
              key={bank}
              onClick={() => setBankName(bank)}
              aria-pressed={bankName === bank}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left text-sm font-semibold ${bankName === bank ? 'border-[#6f5cc1] bg-[#f1effa]' : 'border-[#e2dfe8]'}`}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#33256c] text-white">
                <Landmark size={16} />
              </span>
              {bank}
              {bankName === bank && <Check size={16} className="ml-auto text-[#6f5cc1]" />}
            </button>
          ))}
        </div>
        <button onClick={() => setStep('card')} className={`${PRIMARY_BUTTON} mt-4`}>
          Continue
        </button>
      </Sheet>
    )
  }

  if (step === 'card') {
    return (
      <Sheet title="Which card do you pay with?" onClose={props.onClose}>
        <p className="mb-4 text-sm leading-6 text-[#706b7b]">
          {bankName} shows us the payments made with this card. Only the last 4 digits: the bank already knows the rest.
        </p>
        <label className={LIGHT_LABEL} htmlFor="card-last4">
          Last 4 digits of your card
        </label>
        <input
          id="card-last4"
          inputMode="numeric"
          maxLength={4}
          value={cardLast4}
          onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
          placeholder="4821"
          className={`${LIGHT_INPUT} tracking-[.3em]`}
          autoFocus
        />
        <button onClick={() => setStep('allow')} disabled={cardLast4.length !== 4} className={`${PRIMARY_BUTTON} mt-4`}>
          Continue
        </button>
      </Sheet>
    )
  }

  return (
    <Sheet title="Allow LifeGrowth to read your payments" onClose={props.onClose}>
      <ul className="mb-4 flex flex-col gap-2.5 text-sm leading-6 text-[#706b7b]">
        <li className="flex gap-2.5">
          <Eye size={16} className="mt-1 shrink-0 text-[#6f5cc1]" />
          <span>
            Read payments made with card <b className="text-[#292431]">•• {cardLast4}</b>: the last 90 days and new ones from now on.
          </span>
        </li>
        <li className="flex gap-2.5">
          <Lock size={16} className="mt-1 shrink-0 text-[#6f5cc1]" />
          <span>Read only: Open Banking can&rsquo;t move money. Access lasts 180 days.</span>
        </li>
      </ul>
      <CodeField code={code} setCode={setCode} />
      <button onClick={() => props.onConfirm({ bankName, cardLast4 })} disabled={!codeOk} className={`${PRIMARY_BUTTON} mt-4`}>
        Allow access
      </button>
    </Sheet>
  )
}
