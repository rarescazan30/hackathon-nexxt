'use client'

// Step 2: the three questions the projection needs. AnswerFields is reused in Profile.
import { Card } from '@/components/app/shell'
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON, checkAnswers, type AnswerKey, type OnboardingDraft } from './onboarding-state'

type Answers = Pick<OnboardingDraft, AnswerKey>

const QUESTIONS: { key: AnswerKey; label: string; hint: string; placeholder: string }[] = [
  { key: 'birthYear', label: 'Year of birth', hint: 'Tells us how many years you have until 65.', placeholder: '1992' },
  { key: 'netSalaryRon', label: 'Net salary per month (RON)', hint: 'What lands in your account. Your retirement is compared to this.', placeholder: '6500' },
  { key: 'yearsWorked', label: 'Years you have worked', hint: 'With a work contract in Romania, roughly.', placeholder: '12' },
]

export function AnswerFields({ answers, update }: { answers: Answers; update: (change: Partial<Answers>) => void }) {
  const check = checkAnswers(answers)
  return (
    <div className="flex flex-col gap-5">
      {QUESTIONS.map((question) => {
        const error = check.field === question.key ? check.message : undefined
        return (
          <div key={question.key}>
            <label htmlFor={question.key} className={LABEL_CLASS}>
              {question.label}
            </label>
            <input
              id={question.key}
              inputMode="numeric"
              aria-invalid={Boolean(error)}
              className={`${INPUT_CLASS} ${error ? '!border-[#b42318]' : ''}`}
              placeholder={question.placeholder}
              value={answers[question.key]}
              onChange={(e) => update({ [question.key]: e.target.value })}
            />
            <p className={`mt-1.5 text-xs ${error ? 'text-[#b42318] dark:text-[#f3a4a4]' : 'text-[#96909f]'}`}>{error ?? question.hint}</p>
          </div>
        )
      })}
    </div>
  )
}

export function QuestionsStep({ draft, update, onNext }: { draft: OnboardingDraft; update: (change: Partial<Answers>) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <AnswerFields answers={draft} update={update} />
      </Card>
      <button onClick={onNext} disabled={!checkAnswers(draft).ok} className={PRIMARY_BUTTON}>
        Show me my retirement
      </button>
    </div>
  )
}
