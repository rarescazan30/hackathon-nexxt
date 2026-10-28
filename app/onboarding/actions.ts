'use server'

// Onboarding: read a pension statement PDF, then save everything in one go at the end.
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { extractStatement, type ExtractResult } from '@/lib/ai'
import type { StatementExtract } from '@/lib/contracts'
import { lifestyleNumbers } from '@/lib/data/lifestyle-state'
import { rebuildJar } from '@/lib/server/jar'
import { transactionsForMonth } from '@/lib/server/mock-bank'
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

const OnboardingInput = z.object({
  birthYear: z.number().int().min(1940).max(2010),
  netSalaryBani: z.number().int().positive(),
  yearsWorked: z.number().int().min(0).max(60),
  pensions: z.array(
    z.object({
      kind: z.enum(['pillar2', 'pillar3']),
      provider: z.string().trim().max(80),
      balanceBani: z.number().int().nonnegative(),
      asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      uploadId: z.uuid().optional(),
    }),
  ),
  roundupRuleBani: z.union([z.literal(0), z.literal(100), z.literal(500), z.literal(1000)]),
  salaryPercentBp: z.number().int().min(0).max(2000),
  cardLinked: z.boolean(),
  termsAccepted: z.literal(true),
})
export type OnboardingInput = z.infer<typeof OnboardingInput>

/** Saves the profile, the pensions and the settings, imports a month of (mock) card data, then opens the app. */
export async function completeOnboarding(rawInput: OnboardingInput) {
  const { supabase, userId } = await requireUser()
  const input = OnboardingInput.parse(rawInput)

  // Re-running onboarding replaces what was entered before.
  unwrap(await supabase.from('pension_assets').delete().eq('user_id', userId))
  if (input.pensions.length > 0) {
    unwrap(
      await supabase.from('pension_assets').insert(
        input.pensions.map((pension) => ({
          user_id: userId,
          type: pension.kind,
          provider: pension.provider || null,
          balance_bani: pension.balanceBani,
          source: pension.uploadId ? 'statement_upload' : 'manual',
          as_of: pension.asOf,
        })),
      ),
    )
  }

  // The reveal already showed the starting level: mark it seen so it doesn't replay as a level-up.
  const { startLevel } = lifestyleNumbers({
    birthYear: input.birthYear,
    netSalaryBani: input.netSalaryBani,
    yearsWorked: input.yearsWorked,
    assets: input.pensions.map((pension) => ({ type: pension.kind, balance_bani: pension.balanceBani })),
    jars: [],
  })
  unwrap(
    await supabase
      .from('profiles')
      .update({
        birth_year: input.birthYear,
        net_salary_bani: input.netSalaryBani,
        years_worked: input.yearsWorked,
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
  const uploadIds = input.pensions.flatMap((pension) => (pension.uploadId ? [pension.uploadId] : []))
  if (uploadIds.length > 0) {
    unwrap(await db.from('statement_uploads').update({ status: 'confirmed' }).in('id', uploadIds).eq('user_id', userId))
  }

  // "Connect your card" in the demo: import this month's card payments so far.
  const now = new Date()
  const month = now.toISOString().slice(0, 7)
  if (input.cardLinked) {
    const rows = transactionsForMonth(month, now.getUTCMonth(), input.netSalaryBani, {
      untilDay: now.getUTCDate(),
      idPrefix: `tx-${userId.slice(0, 8)}`,
    }).map((row) => ({ ...row, currency: 'RON', user_id: userId }))
    unwrap(await db.from('transactions').upsert(rows, { onConflict: 'user_id,external_id', ignoreDuplicates: true }))
  }
  await rebuildJar(db, userId, month)

  redirect('/app')
}
