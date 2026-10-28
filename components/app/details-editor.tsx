'use client'

// Profile → "Update your details": the three onboarding answers and the pensions list,
// in a full-screen sheet. Saving goes through updateProfileData (same checks as onboarding).
import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import type { AppData } from '@/lib/data/app-data'
import { updateProfileData } from '@/app/app/actions'
import { Card } from '@/components/app/shell'
import { FormError } from '@/components/auth/form-parts'
import { AnswerFields } from '@/components/onboarding/questions-step'
import { PRIMARY_BUTTON, checkAnswers, pensionIsValid, toBani, type OnboardingDraft, type PensionDraft } from '@/components/onboarding/onboarding-state'
import { PensionsEditor } from '@/components/pensions/pensions-editor'

type Answers = Pick<OnboardingDraft, 'birthYear' | 'netSalaryRon' | 'yearsWorked'>

export function DetailsEditor({ data, onClose }: { data: AppData; onClose: () => void }) {
  const { settings } = data
  const [answers, setAnswers] = useState<Answers>({
    birthYear: String(settings.birthYear ?? ''),
    netSalaryRon: String(settings.netSalaryBani / 100),
    yearsWorked: String(settings.yearsWorked ?? ''),
  })
  const [pensions, setPensions] = useState<PensionDraft[]>(
    data.pensions.map((pension) => ({
      key: pension.id,
      kind: pension.type === 'pillar3' ? 'pillar3' : 'pillar2',
      provider: pension.provider ?? '',
      balanceRon: String(pension.balanceBani / 100),
      asOf: pension.asOf,
      source: 'saved',
    })),
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function save() {
    setError(undefined)
    startTransition(async () => {
      try {
        await updateProfileData({
          birthYear: Number(answers.birthYear),
          netSalaryBani: toBani(answers.netSalaryRon),
          yearsWorked: Number(answers.yearsWorked),
          pensions: pensions.map((p) => ({ kind: p.kind, provider: p.provider, balanceBani: toBani(p.balanceRon), asOf: p.asOf, uploadId: p.uploadId })),
        })
        onClose()
      } catch {
        setError('Something went wrong. Please check your details and try again.')
      }
    })
  }

  const valid = checkAnswers(answers).ok && pensions.every(pensionIsValid)
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#f7f6f9] dark:bg-[#18151f]">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-5 pb-10 pt-6">
        <header className="flex items-center justify-between px-1">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Your details</p>
            <h1 className="text-[27px] font-semibold tracking-[-.04em]">Update your numbers</h1>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex size-10 items-center justify-center rounded-full bg-white text-[#33256c] shadow-sm dark:bg-[#292333] dark:text-white">
            <X size={18} />
          </button>
        </header>
        <p className="px-1 text-sm leading-6 text-[#706b7b] dark:text-[#aaa4b6]">
          Got a raise or a new yearly statement? Update it here. You can also upload a bank statement to add your latest card
          payments. Your days of freedom follow; your level never goes down.
        </p>

        <Card>
          <AnswerFields answers={answers} update={(change) => setAnswers((prev) => ({ ...prev, ...change }))} />
        </Card>

        <p className="mt-2 px-1 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">From a PDF, or by hand</p>
        <PensionsEditor
          accept="any"
          pensions={pensions}
          setPensions={setPensions}
          footer={(busy) => (
            <>
              <FormError message={error} />
              <button onClick={save} disabled={busy || pending || !valid} className={PRIMARY_BUTTON}>
                {pending ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        />
      </div>
    </div>
  )
}
