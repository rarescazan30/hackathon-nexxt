'use client'

// "Open Banking (demo)": the screens of a PSD2 bank connection, with fictional banks and
// data (docs/BANK_IMPLEMENTATION.md). Same sheet as the Stripe card form (components/app/sheet.tsx).
// Steps: pick your bank → pick the card you pay with → allow read access.
// Open Banking only READS payments (for round-ups). Paying is Stripe's job.
import { useState } from 'react'
import { Check, Eye, Landmark, Lock } from 'lucide-react'
import type { BankChoice } from '@/lib/server/profile-data'
import { PRIMARY_BUTTON } from '@/components/onboarding/onboarding-state'
import { SHEET_INPUT, SHEET_LABEL, Sheet as SharedSheet } from '@/components/app/sheet'

export const OPEN_BANKING = 'Open Banking (demo)'

// The one PSD2 provider in the demo: a fictional bank, no real bank names or logos.
const BANKS = ['Demo Bank']
const CODE_LENGTH = 4

type Props = { onConfirm: (choice: BankChoice) => void; onClose: () => void }

const NOTE = 'Demo bank connection · fictional data'

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <SharedSheet eyebrow={OPEN_BANKING} title={title} note={NOTE} onClose={onClose}>
      {children}
    </SharedSheet>
  )
}

function CodeField({ code, setCode }: { code: string; setCode: (code: string) => void }) {
  return (
    <div>
      <label className={SHEET_LABEL} htmlFor="bank-code">
        Code from your bank app (demo: any {CODE_LENGTH} digits)
      </label>
      <input
        id="bank-code"
        inputMode="numeric"
        autoComplete="off"
        maxLength={CODE_LENGTH}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        className={`${SHEET_INPUT} tracking-[.5em]`}
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
        <label className={SHEET_LABEL} htmlFor="card-last4">
          Last 4 digits of your card
        </label>
        <input
          id="card-last4"
          inputMode="numeric"
          maxLength={4}
          value={cardLast4}
          onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
          placeholder="4821"
          className={`${SHEET_INPUT} tracking-[.3em]`}
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
