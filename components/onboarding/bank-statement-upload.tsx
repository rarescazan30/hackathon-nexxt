'use client'

// Onboarding step 4: "No bank connection? Upload a bank statement instead."
// Its card payments become transactions, so round-ups work without Open Banking.
import { useState, useTransition } from 'react'
import { FileUp } from 'lucide-react'
import { uploadDocument } from '@/app/onboarding/actions'
import { FormError } from '@/components/auth/form-parts'
import { ImportNotice, importSummary } from '@/components/pensions/pensions-editor'

export function BankStatementUpload() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()

  function onFile(file: File | undefined) {
    if (!file) return
    setError(undefined)
    setNotice(undefined)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('accept', 'bank')
    startTransition(async () => {
      const result = await uploadDocument(formData)
      if (!result.ok) setError(result.message)
      else if (result.type === 'bank') setNotice(importSummary(result.imported))
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={`flex cursor-pointer items-center gap-3 rounded-[24px] border-2 border-dashed border-[#ddd4fa] bg-white p-4 text-sm dark:border-[#353042] dark:bg-[#211d2b] ${pending ? 'opacity-60' : ''}`}>
        <FileUp size={20} className="shrink-0 text-[#6f5cc1]" />
        <span>
          <b className="block">{pending ? 'Reading your statement…' : 'No bank connection? Upload a bank statement'}</b>
          <span className="text-xs text-[#858090] dark:text-[#a39cab]">PDF from your bank app. We add its card payments for round-ups.</span>
        </span>
        <input type="file" accept="application/pdf" className="sr-only" disabled={pending} onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <FormError message={error} />
      <ImportNotice message={notice} />
    </div>
  )
}
