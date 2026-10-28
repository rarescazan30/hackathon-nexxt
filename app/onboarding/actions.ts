'use server'

// Onboarding (and Profile): read an uploaded PDF (pension or bank statement), then save
// everything in one go at the end of onboarding.
import { refresh } from 'next/cache'
import { WELCOME_BONUS_XP } from '@/lib/rules/lifestyle'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { extractDocument } from '@/lib/ai'
import type { StatementExtract } from '@/lib/contracts'
import { rebuildJar } from '@/lib/server/jar'
import { BankChoice, profileDataFields, rejectOddProfile, saveProfileData } from '@/lib/server/profile-data'
import { importBankHistory } from '@/lib/server/mock-bank'
import { importStatementTransactions, type StatementImportResult } from '@/lib/server/statement-import'
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
  | { ok: true; type: 'pension'; uploadId: string; extract: StatementExtract; source: 'ai' | 'sample' }
  | { ok: true; type: 'bank'; imported: StatementImportResult; source: 'ai' | 'sample' }
  /** `typeIn`: show a pension card to fill by hand right away. */
  | { ok: false; message: string; typeIn?: boolean }

/** What the upload box on this screen takes: pension statements, bank statements or both. */
const Accept = z.enum(['pension', 'bank', 'any'])
export type UploadAccept = z.infer<typeof Accept>

const WRONG_KIND = {
  pension: "This is a bank statement. You can add it at the round-ups step or later in Profile.",
  bank: 'This is a pension statement. Add it with your pensions (step 1, or Profile → Update your details).',
}

/**
 * Stores the PDF in the user's private folder and asks the AI what it is:
 * a pension statement (the user checks the numbers before saving) or a bank statement
 * (its card payments are added right away, skipping ones we already have).
 */
export async function uploadDocument(formData: FormData): Promise<UploadResult> {
  const { supabase, userId } = await requireUser()
  const file = formData.get('file')
  const accept = Accept.catch('pension').parse(formData.get('accept'))
  if (!(file instanceof File) || file.type !== 'application/pdf') return { ok: false, message: 'Please choose a PDF file.' }
  if (file.size > MAX_PDF_BYTES) return { ok: false, message: 'The file is too large (max 5 MB).' }

  const filePath = `${userId}/${crypto.randomUUID()}.pdf`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: storageError } = await supabase.storage.from('statements').upload(filePath, bytes, { contentType: 'application/pdf' })
  if (storageError) return { ok: false, message: "We couldn't upload the file. Please try again." }

  const upload = unwrap(await supabase.from('statement_uploads').insert({ user_id: userId, file_path: filePath }).select('id').single())

  // Users can't update this row themselves (RLS), so the result is written by the server.
  const result = await extractDocument(bytes, file.name)
  const db = createAdminClient()
  const typeIn = accept !== 'bank'
  if (!result.ok) {
    unwrap(await db.from('statement_uploads').update({ status: 'failed', error: result.reason }).eq('id', upload.id))
    const message =
      result.reason === 'not_a_statement'
        ? "This doesn't look like a statement we can read."
        : "We couldn't read it automatically."
    return { ok: false, typeIn, message: typeIn ? `${message} Please type the numbers from your statement below.` : `${message} Try another file.` }
  }
  if (accept !== 'any' && result.type !== accept) {
    unwrap(await db.from('statement_uploads').update({ status: 'failed', error: `wrong_kind:${result.type}` }).eq('id', upload.id))
    return { ok: false, message: WRONG_KIND[accept] }
  }

  if (result.type === 'bank') {
    const imported = await importStatementTransactions(db, userId, result.transactions)
    unwrap(
      await db
        .from('statement_uploads')
        .update({ status: 'confirmed', kind: 'bank', extracted: { type: 'bank', ...imported } })
        .eq('id', upload.id),
    )
    refresh() // the Month tab shows the new payments
    return { ok: true, type: 'bank', imported, source: result.source }
  }

  unwrap(
    await db
      .from('statement_uploads')
      .update({ status: 'extracted', kind: result.extract.kind, extracted: result.extract })
      .eq('id', upload.id),
  )
  return { ok: true, type: 'pension', uploadId: upload.id, extract: result.extract, source: result.source }
}

const OnboardingInput = z
  .object({
    ...profileDataFields,
    roundupRuleBani: z.union([z.literal(0), z.literal(100), z.literal(500), z.literal(1000)]),
    salaryPercentBp: z.number().int().min(0).max(2000),
    cardLinked: z.boolean(),
    bank: BankChoice.optional(),
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
        bank_name: input.cardLinked ? (input.bank?.bankName ?? null) : null,
        bank_card_last4: input.cardLinked ? (input.bank?.cardLast4 ?? null) : null,
        terms_accepted_at: new Date().toISOString(),
        last_seen_level: startLevel,
        welcome_bonus_xp: WELCOME_BONUS_XP,
        onboarding_completed: true,
      })
      .eq('id', userId),
  )

  const db = createAdminClient()

  // "Open Banking (demo)": the bank sends the last 3 months of payments + this month so far.
  const month = new Date().toISOString().slice(0, 7)
  if (input.cardLinked) {
    await importBankHistory(db, userId, month, input.netSalaryBani)
  }
  await rebuildJar(db, userId, month)

  redirect('/app')
}
