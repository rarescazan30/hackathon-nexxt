'use server'

// Onboarding: read a pension statement PDF, then save everything in one go at the end.
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { extractStatement, type ExtractResult } from '@/lib/ai'
import type { StatementExtract } from '@/lib/contracts'
import { rebuildJar } from '@/lib/server/jar'
import { profileDataFields, rejectOddProfile, saveProfileData } from '@/lib/server/profile-data'
import { importMockMonth } from '@/lib/server/mock-bank'
import { unwrap } from '@/lib/server/unwrap'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAX_PDF_BYTES = 5 * 1024 * 1024

async function requireUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  return { supabase, userId: data.user.id }
}

export type UploadResult =
  | { ok: true; uploadId: string; extract: StatementExtract; source: 'ai' | 'sample' }
  | { ok: false; message: string }

const READ_ERRORS: Record<Extract<ExtractResult, { ok: false }>['reason'], string> = {
  not_a_statement: "This doesn't look like a pension statement. Try another file or type it in.",
  unreadable: "We couldn't read this file. Type the numbers in instead.",
}

/** Stores the PDF in the user's private folder and asks the AI to read it. */
export async function uploadStatement(formData: FormData): Promise<UploadResult> {
  const { supabase, userId } = await requireUser()
  const file = formData.get('file')
  if (!(file instanceof File) || file.type !== 'application/pdf') return { ok: false, message: 'Please choose a PDF file.' }
  if (file.size > MAX_PDF_BYTES) return { ok: false, message: 'The file is too large (max 5 MB).' }

  const filePath = `${userId}/${crypto.randomUUID()}.pdf`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: storageError } = await supabase.storage.from('statements').upload(filePath, bytes, { contentType: 'application/pdf' })
  if (storageError) return { ok: false, message: "We couldn't upload the file. Please try again." }

  const upload = unwrap(await supabase.from('statement_uploads').insert({ user_id: userId, file_path: filePath }).select('id').single())

  // Users can't update this row themselves (RLS), so the result is written by the server.
  const result = await extractStatement(bytes)
  const db = createAdminClient()
  if (!result.ok) {
    unwrap(await db.from('statement_uploads').update({ status: 'failed', error: result.reason }).eq('id', upload.id))
    return { ok: false, message: READ_ERRORS[result.reason] }
  }
  unwrap(
    await db
      .from('statement_uploads')
      .update({ status: 'extracted', kind: result.extract.kind, extracted: result.extract })
      .eq('id', upload.id),
  )
  return { ok: true, uploadId: upload.id, extract: result.extract, source: result.source }
}

const OnboardingInput = z
  .object({
    ...profileDataFields,
    roundupRuleBani: z.union([z.literal(0), z.literal(100), z.literal(500), z.literal(1000)]),
    salaryPercentBp: z.number().int().min(0).max(2000),
    cardLinked: z.boolean(),
    termsAccepted: z.literal(true),
  })
  .superRefine(rejectOddProfile)
export type OnboardingInput = z.infer<typeof OnboardingInput>

/** Saves the profile, the pensions and the settings, imports a month of (mock) card data, then opens the app. */
export async function completeOnboarding(rawInput: OnboardingInput) {
  const { supabase, userId } = await requireUser()
  const input = OnboardingInput.parse(rawInput)

  // Re-running onboarding replaces what was entered before.
  const startLevel = await saveProfileData(supabase, userId, input, null)

  // The reveal already showed the starting level: mark it seen so it doesn't replay as a level-up.
  unwrap(
    await supabase
      .from('profiles')
      .update({
        roundup_rule_bani: input.roundupRuleBani,
        salary_percent_bp: input.salaryPercentBp,
        card_linked: input.cardLinked,
        terms_accepted_at: new Date().toISOString(),
        last_seen_level: startLevel,
        onboarding_completed: true,
      })
      .eq('id', userId),
  )

  const db = createAdminClient()

  // "Connect your card" in the demo: import this month's card payments so far.
  const now = new Date()
  const month = now.toISOString().slice(0, 7)
  if (input.cardLinked) {
    await importMockMonth(db, userId, month, input.netSalaryBani, { untilDay: now.getUTCDate() })
  }
  await rebuildJar(db, userId, month)

  redirect('/app')
}
