'use client'

// The pensions list: upload a Pillar II / III statement (the AI reads it, the user checks
// it) or add one by hand. Used in onboarding step 1 and in Profile → "Your details".
import { useState, useTransition } from 'react'
import { FileUp, Sparkles, Trash2 } from 'lucide-react'
import { uploadDocument, type UploadAccept } from '@/app/onboarding/actions'
import type { StatementImportResult } from '@/lib/server/statement-import'
import { formatRon } from '@/lib/rules/lifestyle'
import { Card } from '@/components/app/shell'
import { FormError } from '@/components/auth/form-parts'
import {
  INPUT_CLASS,
  LABEL_CLASS,
  SECONDARY_BUTTON,
  type PensionDraft,
} from '@/components/onboarding/onboarding-state'

const SOURCE_TAGS: Record<PensionDraft['source'], string> = {
  ai: 'Read by AI, please check',
  sample: 'Sample values (AI is off in this demo)',
  manual: 'Typed by you',
  saved: 'Saved in your profile',
}

/** A new card starts as the pillar that is still missing (Pillar II first). */
function missingKind(pensions: PensionDraft[]): PensionDraft['kind'] {
  return pensions.some((p) => p.kind === 'pillar2') ? 'pillar3' : 'pillar2'
}

/** "Found 13 transactions (11 card payments): 8 new, 5 you already had. +12.40 RON in round-ups this month." */
export function importSummary(imported: StatementImportResult) {
  const parts = [`Found ${imported.found} transactions (${imported.cardPayments} card payments): ${imported.added} new, ${imported.skipped} you already had.`]
  if (imported.roundupBani > 0) parts.push(`+${formatRon(imported.roundupBani)} in round-ups this month.`)
  return parts.join(' ')
}

export function ImportNotice({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="status" className="rounded-xl bg-[#e3f5e9] px-3.5 py-2.5 text-sm leading-6 text-[#236243] dark:bg-[#1e3629] dark:text-[#bfe8d1]">
      {message}
    </p>
  )
}

function PensionCard({ pension, onChange, onRemove, autoFocus = false }: { pension: PensionDraft; onChange: (p: PensionDraft) => void; onRemove: () => void; autoFocus?: boolean }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 rounded-full bg-[#f1effa] px-2.5 py-1 text-xs font-semibold text-[#6b57bd] dark:bg-[#2b253a] dark:text-[#a594f0]">
          {(pension.source === 'ai' || pension.source === 'sample') && <Sparkles size={12} />} {SOURCE_TAGS[pension.source]}
        </span>
        <button onClick={onRemove} aria-label="Remove" className="text-[#96909f] hover:text-[#b42318]">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(['pillar2', 'pillar3'] as const).map((kind) => (
          <button
            key={kind}
            onClick={() => onChange({ ...pension, kind })}
            aria-pressed={pension.kind === kind}
            className={`pulse-hover rounded-xl py-2.5 text-xs font-semibold ${pension.kind === kind ? 'bg-[#33256c] text-white' : 'bg-[#f1effa] text-[#706b7b] dark:bg-[#2b253a] dark:text-[#aaa4b6]'}`}
          >
            {kind === 'pillar2' ? 'Pillar II' : 'Pillar III'}
          </button>
        ))}
      </div>
      <div>
        <label className={LABEL_CLASS} htmlFor={`${pension.key}-provider`}>Fund</label>
        <input id={`${pension.key}-provider`} autoFocus={autoFocus} className={INPUT_CLASS} value={pension.provider} placeholder="e.g. NN Pensii" onChange={(e) => onChange({ ...pension, provider: e.target.value })} />
      </div>
      {/* One row per field on phones: the browser's date picker is wider than half a card. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0">
          <label className={LABEL_CLASS} htmlFor={`${pension.key}-balance`}>Balance (RON)</label>
          <input id={`${pension.key}-balance`} className={INPUT_CLASS} inputMode="decimal" value={pension.balanceRon} onChange={(e) => onChange({ ...pension, balanceRon: e.target.value })} />
        </div>
        <div className="min-w-0">
          <label className={LABEL_CLASS} htmlFor={`${pension.key}-date`}>On date</label>
          <input id={`${pension.key}-date`} type="date" className={`${INPUT_CLASS} min-w-0 appearance-none`} value={pension.asOf} onChange={(e) => onChange({ ...pension, asOf: e.target.value })} />
        </div>
      </div>
    </Card>
  )
}

/**
 * `footer` renders under the list and gets `busy` (a statement is being read), so the
 * parent can disable its own Continue / Save button meanwhile.
 * `accept`: 'pension' (onboarding) or 'any' (Profile: a bank statement adds payments too).
 */
export function PensionsEditor({
  pensions,
  setPensions,
  footer,
  accept = 'pension',
}: {
  pensions: PensionDraft[]
  setPensions: (p: PensionDraft[]) => void
  footer?: (busy: boolean) => React.ReactNode
  accept?: Extract<UploadAccept, 'pension' | 'any'>
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [focusKey, setFocusKey] = useState<string>()

  function onFile(file: File | undefined) {
    if (!file) return
    setError(undefined)
    setNotice(undefined)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('accept', accept)
    startTransition(async () => {
      const result = await uploadDocument(formData)
      if (!result.ok) {
        setError(result.message)
        // The AI couldn't read it: open a card to type the numbers in, right away.
        if (result.typeIn) {
          const key = crypto.randomUUID()
          const kind = /iii|pilon.?3|pillar.?3|facultativ/i.test(file.name) ? 'pillar3' : missingKind(pensions)
          setPensions([...pensions, { key, kind, provider: '', balanceRon: '', asOf: '', source: 'manual' }])
          setFocusKey(key)
        }
        return
      }
      if (result.type === 'bank') {
        setNotice(importSummary(result.imported))
        return
      }
      const { extract } = result
      setPensions([
        ...pensions,
        {
          key: result.uploadId,
          kind: extract.kind,
          provider: extract.provider,
          balanceRon: String(extract.balanceBani / 100),
          asOf: extract.asOf,
          uploadId: result.uploadId,
          source: result.source,
        },
      ])
    })
  }

  const addManual = () =>
    setPensions([...pensions, { key: crypto.randomUUID(), kind: missingKind(pensions), provider: '', balanceRon: '', asOf: '', source: 'manual' }])
  const update = (index: number, pension: PensionDraft) => setPensions(pensions.map((p, i) => (i === index ? pension : p)))
  const remove = (index: number) => setPensions(pensions.filter((_, i) => i !== index))

  return (
    <div className="flex flex-col gap-4">
      <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-[24px] border-2 border-dashed border-[#ddd4fa] bg-white px-5 py-8 text-center dark:border-[#353042] dark:bg-[#211d2b] ${pending ? 'opacity-60' : ''}`}>
        <FileUp size={26} className="text-[#6f5cc1]" />
        <span className="text-sm font-semibold">{pending ? 'Reading your document…' : 'Upload a statement (PDF)'}</span>
        {accept === 'any' ? (
          <span className="flex flex-col gap-1 text-xs text-[#858090] dark:text-[#a39cab]">
            <span>
              <b className="text-[#6b57bd] dark:text-[#a594f0]">Pension statement</b> → updates your pensions
            </span>
            <span>
              <b className="text-[#6b57bd] dark:text-[#a594f0]">Bank statement</b> → adds your latest card payments
            </span>
          </span>
        ) : (
          <>
            <span className="text-xs text-[#858090] dark:text-[#a39cab]">Your fund sends one every year; you can also download it from its website.</span>
            <span className="text-xs font-medium text-[#6b57bd] dark:text-[#a594f0]">Have both Pillar II and Pillar III? Add them one after the other.</span>
          </>
        )}
        <input type="file" accept="application/pdf" className="sr-only" disabled={pending} onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <FormError message={error} />
      <ImportNotice message={notice} />

      {pensions.map((pension, index) => (
        <PensionCard key={pension.key} pension={pension} autoFocus={pension.key === focusKey} onChange={(p) => update(index, p)} onRemove={() => remove(index)} />
      ))}

      <button onClick={addManual} className={SECONDARY_BUTTON}>
        {pensions.length === 0 ? 'Add a pension by hand' : 'Add another pension'}
      </button>
      {footer?.(pending)}
    </div>
  )
}
