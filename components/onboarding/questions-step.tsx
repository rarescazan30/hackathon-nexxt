'use client'

// Step 2: the three questions the projection needs.
import { Card } from '@/components/app/shell'
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON, questionsAreValid, type OnboardingDraft } from './onboarding-state'

type Answers = Pick<OnboardingDraft, 'birthYear' | 'netSalaryRon' | 'yearsWorked'>

const QUESTIONS: { key: keyof Answers; label: string; hint: string; placeholder: string }[] = [
  { key: 'birthYear', label: 'Year of birth', hint: 'Tells us how many years you have until 65.', placeholder: '1992' },
  { key: 'netSalaryRon', label: 'Net salary per month (RON)', hint: 'What lands in your account. Your retirement is compared to this.', placeholder: '6500' },
  { key: 'yearsWorked', label: 'Years you have worked', hint: 'With a work contract in Romania, roughly.', placeholder: '12' },
]

export function QuestionsStep({ draft, update, onNext }: { draft: OnboardingDraft; update: (change: Partial<Answers>) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-5">
        {QUESTIONS.map((question) => (
          <div key={question.key}>
            <label htmlFor={question.key} className={LABEL_CLASS}>
              {question.label}
            </label>
            <input
              id={question.key}
              inputMode="numeric"
              className={INPUT_CLASS}
              placeholder={question.placeholder}
              value={draft[question.key]}
              onChange={(e) => update({ [question.key]: e.target.value })}
            />
            <p className="mt-1.5 text-xs text-[#96909f]">{question.hint}</p>
          </div>
        ))}
      </Card>
      <button onClick={onNext} disabled={!questionsAreValid(draft)} className={PRIMARY_BUTTON}>
        Show me my retirement
      </button>
    </div>
  )
}
