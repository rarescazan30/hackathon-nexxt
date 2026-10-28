'use client'

// Step 4: round-up rule, salary share, card connection (through the demo bank) and the terms.
import { useState } from 'react'
import Link from 'next/link'
import { Check, CreditCard } from 'lucide-react'
import { formatRon, roundUp } from '@/lib/rules'
import { Card } from '@/components/app/shell'
import { FormError } from '@/components/auth/form-parts'
import { DemoBank, OPEN_BANKING } from '@/components/bank/demo-bank'
import { BankStatementUpload } from './bank-statement-upload'
import { PRIMARY_BUTTON, type OnboardingDraft } from './onboarding-state'

const ROUNDUP_OPTIONS: { bani: OnboardingDraft['roundupRuleBani']; label: string }[] = [
  { bani: 100, label: '1 RON' },
  { bani: 500, label: '5 RON' },
  { bani: 1000, label: '10 RON' },
  { bani: 0, label: 'Off' },
]
const SALARY_OPTIONS = [0, 100, 300, 500]
const EXAMPLE_PAYMENT_BANI = 1230 // a coffee

type Settings = Pick<OnboardingDraft, 'roundupRuleBani' | 'salaryPercentBp' | 'cardLinked' | 'bank' | 'termsAccepted'>

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`pulse-hover whitespace-nowrap rounded-xl py-2.5 text-xs font-semibold ${selected ? 'bg-[#33256c] text-white' : 'bg-[#f1effa] text-[#706b7b] dark:bg-[#2b253a] dark:text-[#aaa4b6]'}`}
    >
      {children}
    </button>
  )
}

export function PiggyBankStep({ draft, update, onFinish, pending, error }: { draft: OnboardingDraft; update: (change: Partial<Settings>) => void; onFinish: () => void; pending: boolean; error?: string }) {
  const exampleRoundUp = roundUp(EXAMPLE_PAYMENT_BANI, { stepBani: draft.roundupRuleBani })
  const [connecting, setConnecting] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-sm font-semibold">Round up each card payment to</p>
        <p className="mb-3 text-xs text-[#858090] dark:text-[#a39cab]">
          Coffee {formatRon(EXAMPLE_PAYMENT_BANI)} →{' '}
          <b className="text-[#438565] dark:text-[#6bc495]">+{formatRon(exampleRoundUp)}</b> for your retirement
        </p>
        <div className="grid grid-cols-4 gap-2">
          {ROUNDUP_OPTIONS.map((option) => (
            <Choice key={option.bani} selected={draft.roundupRuleBani === option.bani} onClick={() => update({ roundupRuleBani: option.bani })}>
              {option.label}
            </Choice>
          ))}
        </div>

        <p className="mt-5 text-sm font-semibold">Plus a share of your salary</p>
        <p className="mb-3 text-xs text-[#858090] dark:text-[#a39cab]">Once a month, on payday</p>
        <div className="grid grid-cols-4 gap-2">
          {SALARY_OPTIONS.map((bp) => (
            <Choice key={bp} selected={draft.salaryPercentBp === bp} onClick={() => update({ salaryPercentBp: bp })}>
              {bp / 100}%
            </Choice>
          ))}
        </div>
      </Card>

      {connecting && (
        <DemoBank
          onClose={() => setConnecting(false)}
          onConfirm={(bank) => {
            setConnecting(false)
            update({ cardLinked: true, bank })
          }}
        />
      )}
      <button
        onClick={() => (draft.cardLinked ? update({ cardLinked: false }) : setConnecting(true))}
        aria-pressed={draft.cardLinked}
        className={`flex items-center gap-3 rounded-[24px] border p-4 text-left text-sm transition-colors ${
          draft.cardLinked ? 'border-[#bfe8d1] bg-[#e3f5e9] dark:border-[#236243] dark:bg-[#1e3629]' : 'border-black/[.06] bg-white dark:border-white/10 dark:bg-[#211d2b]'
        }`}
      >
        <span className={`flex size-10 items-center justify-center rounded-xl ${draft.cardLinked ? 'bg-[#438565] text-white' : 'bg-[#f1effa] text-[#6f5cc1] dark:bg-[#2b253a]'}`}>
          {draft.cardLinked ? <Check size={18} /> : <CreditCard size={18} />}
        </span>
        <span>
          <b className="block">{draft.cardLinked ? 'Bank connected' : 'Connect your bank'}</b>
          <span className="text-xs text-[#858090] dark:text-[#a39cab]">
            {draft.cardLinked && draft.bank
              ? `${draft.bank.bankName} · card •• ${draft.bank.cardLast4} · last 90 days imported`
              : `${OPEN_BANKING}: reads your card payments for round-ups`}
          </span>
        </span>
      </button>

      {!draft.cardLinked && <BankStatementUpload />}

      <p className="px-1 text-xs leading-5 text-[#858090] dark:text-[#a39cab]">
        Open Banking only <b>reads</b> your payments to count round-ups. Paying happens at the end of the month, by card (Stripe) or
        bank transfer, and only when you say yes.
      </p>

      {/* The terms link sits outside the label, so tapping it doesn't tick the box. */}
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-start gap-3 text-xs leading-5 text-[#706b7b] dark:text-[#aaa4b6]">
          <input type="checkbox" checked={draft.termsAccepted} onChange={(e) => update({ termsAccepted: e.target.checked })} className="mt-0.5 size-4 accent-[#6f5cc1]" />
          <span>
            I agree to the terms: each month I choose to add money, our banking partner holds it for one month and LifeGrowth keeps the
            interest, then it goes to my Pillar III.
          </span>
        </label>
        <Link href="/terms" target="_blank" className="pulse-hover ml-7 inline-flex w-fit items-center gap-1.5 rounded-xl bg-[#f1effa] px-3.5 py-2 text-xs font-semibold text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
          Read the terms
        </Link>
      </div>

      <FormError message={error} />
      <button onClick={onFinish} disabled={pending || !draft.termsAccepted} className={PRIMARY_BUTTON}>
        {pending ? 'Setting things up…' : 'Start saving'}
      </button>
    </div>
  )
}
