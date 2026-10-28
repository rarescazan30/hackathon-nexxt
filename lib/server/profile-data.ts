// What a user tells us about themselves (salary, age, years worked, pensions), validated
// and saved the same way from onboarding and from Profile → "Your details".
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { lifestyleNumbers } from '@/lib/data/lifestyle-state'
import { profileError } from '@/lib/rules/profile-limits'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'
import { unwrap } from './unwrap'

const PensionInput = z.object({
  kind: z.enum(['pillar2', 'pillar3']),
  provider: z.string().trim().max(80),
  balanceBani: z.number().int().nonnegative(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  uploadId: z.uuid().optional(),
})

/** What the user picked on the Open Banking (demo) screen: a bank and a card's last 4 digits. */
export const BankChoice = z.object({
  bankName: z.string().trim().min(2).max(40),
  cardLast4: z.string().regex(/^\d{4}$/),
})
export type BankChoice = z.infer<typeof BankChoice>

/** The fields both forms send. Use with `.superRefine(rejectOddProfile)`. */
export const profileDataFields = {
  birthYear: z.number().int(),
  netSalaryBani: z.number().int(),
  yearsWorked: z.number().int(),
  pensions: z.array(PensionInput).max(10),
}

/** Same limits as the browser (lib/rules/profile-limits), checked again on the server. */
export function rejectOddProfile(input: { birthYear: number; netSalaryBani: number; yearsWorked: number }, ctx: z.RefinementCtx) {
  const error = profileError(input)
  if (error) ctx.addIssue({ code: 'custom', path: [error.field], message: error.message })
}

export const ProfileDataInput = z.object(profileDataFields).superRefine(rejectOddProfile)
export type ProfileDataInput = z.infer<typeof ProfileDataInput>

/**
 * Replaces the user's pensions and saves their facts. The starting level is only ever
 * raised (profiles.start_level), so the level never goes down. Returns the new start level.
 * `supabase` is the user's own client: RLS makes sure only their rows change.
 */
export async function saveProfileData(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: ProfileDataInput,
  previousStartLevel: number | null,
) {
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

  const { startLevel } = lifestyleNumbers({
    birthYear: input.birthYear,
    netSalaryBani: input.netSalaryBani,
    yearsWorked: input.yearsWorked,
    assets: input.pensions.map((pension) => ({ type: pension.kind, balance_bani: pension.balanceBani })),
    jars: [],
    storedStartLevel: previousStartLevel,
  })
  unwrap(
    await supabase
      .from('profiles')
      .update({
        birth_year: input.birthYear,
        net_salary_bani: input.netSalaryBani,
        years_worked: input.yearsWorked,
        start_level: startLevel,
      })
      .eq('id', userId),
  )

  // Users can't change upload rows themselves (RLS), so the server confirms them.
  const uploadIds = input.pensions.flatMap((pension) => (pension.uploadId ? [pension.uploadId] : []))
  if (uploadIds.length > 0) {
    const db = createAdminClient()
    unwrap(await db.from('statement_uploads').update({ status: 'confirmed' }).in('id', uploadIds).eq('user_id', userId))
  }
  return startLevel
}
