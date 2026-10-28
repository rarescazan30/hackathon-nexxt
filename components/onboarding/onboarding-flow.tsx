'use client'

// Onboarding (/onboarding): 4 steps, one per screen, saved together at the end.
import { useMemo, useState, useTransition } from 'react'
import { ArrowLeft } from 'lucide-react'
import { lifestyleNumbers } from '@/lib/data/lifestyle-state'
import { completeOnboarding } from '@/app/onboarding/actions'
import { Logo } from '@/components/app/shell'
import { DocumentsStep } from './documents-step'
import { PiggyBankStep } from './piggy-bank-step'
import { QuestionsStep } from './questions-step'
import { RevealStep } from './reveal-step'
import { EMPTY_DRAFT, toBani, type OnboardingDraft } from './onboarding-state'

const STEPS = [
  { eyebrow: 'Step 1 of 4', title: 'Your pension documents', subtitle: 'Upload your Pillar II statement, and Pillar III if you have one. We read it for you.' },
  { eyebrow: 'Step 2 of 4', title: 'Three quick questions', subtitle: 'So we can project your retirement.' },
  { eyebrow: 'Your retirement, today', title: 'If you retired today, this is how you’d live', subtitle: 'Based on your state pension and your private pensions.' },
  { eyebrow: 'Step 4 of 4', title: 'Your piggy bank', subtitle: 'Small amounts, every day. You confirm once a month.' },
]

export function OnboardingFlow({ firstName }: { firstName: string }) {
  const [step, setStepState] = useState(0)
  const setStep = (next: number) => {
    setStepState(next)
    window.scrollTo({ top: 0 })
  }
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const update = (change: Partial<OnboardingDraft>) => setDraft((prev) => ({ ...prev, ...change }))

  const pensions = draft.pensions.map((p) => ({ kind: p.kind, provider: p.provider, balanceBani: toBani(p.balanceRon), asOf: p.asOf, uploadId: p.uploadId }))
  const numbers = useMemo(
    () =>
      lifestyleNumbers({
        birthYear: Number(draft.birthYear) || null,
        netSalaryBani: toBani(draft.netSalaryRon) || null,
        yearsWorked: Number(draft.yearsWorked) || 0,
        assets: draft.pensions.map((p) => ({ type: p.kind, balance_bani: toBani(p.balanceRon) || 0 })),
        jars: [],
      }),
    [draft.birthYear, draft.netSalaryRon, draft.yearsWorked, draft.pensions],
  )

  function finish() {
    setError(undefined)
    startTransition(async () => {
      try {
        await completeOnboarding({
          birthYear: Number(draft.birthYear),
          netSalaryBani: toBani(draft.netSalaryRon),
          yearsWorked: Number(draft.yearsWorked),
          pensions,
          roundupRuleBani: draft.roundupRuleBani,
          salaryPercentBp: draft.salaryPercentBp,
          cardLinked: draft.cardLinked,
          bank: draft.cardLinked ? draft.bank : undefined,
          termsAccepted: true,
        })
      } catch (e) {
        // redirect() also throws; only real errors reach here without leaving the page.
        if (e instanceof Error && !e.message.includes('NEXT_REDIRECT')) setError('Something went wrong. Please try again.')
      }
    })
  }

  const current = STEPS[step]
  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-10 pt-6">
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} aria-label="Back" className="flex size-10 items-center justify-center rounded-full bg-white text-[#33256c] shadow-sm dark:bg-[#292333] dark:text-white">
              <ArrowLeft size={18} />
            </button>
          ) : (
            <Logo />
          )}
          <span className="text-xs text-[#96909f]">Hi, {firstName}</span>
        </div>

        <div className="mt-5 flex gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#6f5cc1]' : 'bg-[#e2dfe8] dark:bg-[#353042]'}`} />
          ))}
        </div>

        <header className="px-1 pb-6 pt-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">{current.eyebrow}</p>
          <h1 className="text-[27px] font-semibold leading-tight tracking-[-.04em]">{current.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#706b7b] dark:text-[#aaa4b6]">{current.subtitle}</p>
        </header>

        {step === 0 && <DocumentsStep pensions={draft.pensions} setPensions={(p) => update({ pensions: p })} onNext={() => setStep(1)} />}
        {step === 1 && <QuestionsStep draft={draft} update={update} onNext={() => setStep(2)} />}
        {step === 2 && <RevealStep numbers={numbers} onNext={() => setStep(3)} />}
        {step === 3 && <PiggyBankStep draft={draft} update={update} onFinish={finish} pending={pending} error={error} />}
      </div>
    </main>
  )
}
