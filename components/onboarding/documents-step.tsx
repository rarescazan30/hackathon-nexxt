'use client'

// Step 1: the user's private pensions, from a statement PDF or typed in.
// "I don't have a private pension" is always available.
import { PensionsEditor } from '@/components/pensions/pensions-editor'
import { PRIMARY_BUTTON, pensionIsValid, type PensionDraft } from './onboarding-state'

export function DocumentsStep({ pensions, setPensions, onNext }: { pensions: PensionDraft[]; setPensions: (p: PensionDraft[]) => void; onNext: () => void }) {
  return (
    <PensionsEditor
      pensions={pensions}
      setPensions={setPensions}
      footer={(busy) => (
        <button onClick={onNext} disabled={busy || !pensions.every(pensionIsValid)} className={PRIMARY_BUTTON}>
          {pensions.length > 0 ? 'Continue' : "I don't have a private pension"}
        </button>
      )}
    />
  )
}
