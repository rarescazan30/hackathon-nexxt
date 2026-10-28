// The monthly money flow (docs/plan.md, section 4):
//   offer → the user answers → collect (money leaves their bank, we hold it)
//   → invest one month later into Pillar III (we keep the interest from that month).
// Server only, with the admin client: users can't change jar statuses themselves.
// Relative imports (not "@/") so scripts/seed.ts can run this with jiti.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/database.types'
import { PRODUCT_CATALOG, floatInterestBani, formatRon } from '../rules'
import { rebuildJar } from './jar'
import { unwrap } from './unwrap'

type Db = SupabaseClient<Database>

export const PILLAR_THREE_PRODUCT_ID = PRODUCT_CATALOG.pillar3.id

/** On the offer, the user can pick any amount up to twice the suggestion. */
export const MAX_OFFER_MULTIPLE = 2

const MS_PER_DAY = 86_400_000

function defaultOfferMessage(amountBani: number) {
  return `You saved ${formatRon(amountBani, { wholeRon: true })} this month. Add it to your Pillar III pension?`
}

/** '2026-10-01' → '2026-11-01' */
export function oneMonthLater(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month, day)) // month is 0-based, so this is +1 month
  return next.toISOString().slice(0, 10)
}

async function getJar(db: Db, jarId: string) {
  return unwrap(await db.from('monthly_jars').select('*').eq('id', jarId).single())
}

function assertStatus(status: string, expected: string, jarId: string) {
  if (status !== expected) throw new Error(`Jar ${jarId} is "${status}", expected "${expected}"`)
}

/** Month end: recalculate the jar one last time and turn it into an offer. */
export async function offerJar(db: Db, userId: string, month: string, message?: string) {
  const jar = await rebuildJar(db, userId, month)
  if (jar.status !== 'open' && jar.status !== 'offered') {
    throw new Error(`The ${month} jar was already answered`)
  }
  return unwrap(
    await db
      .from('monthly_jars')
      .update({ status: 'offered', offer_message: message ?? defaultOfferMessage(jar.total_bani) })
      .eq('id', jar.id)
      .select()
      .single(),
  )
}

export type OfferAnswer = { accept: true; amountBani: number } | { accept: false }

/** The user's tap on the offer card. `userId` comes from the session, never from the form. */
export async function answerOffer(db: Db, userId: string, jarId: string, answer: OfferAnswer) {
  const jar = await getJar(db, jarId)
  if (jar.user_id !== userId) throw new Error('Not your jar')
  assertStatus(jar.status, 'offered', jarId)

  if (!answer.accept) {
    return unwrap(await db.from('monthly_jars').update({ status: 'declined' }).eq('id', jarId).select().single())
  }

  const maxBani = jar.total_bani * MAX_OFFER_MULTIPLE
  if (!Number.isInteger(answer.amountBani) || answer.amountBani <= 0 || answer.amountBani > maxBani) {
    throw new Error(`Amount must be between 0.01 and ${formatRon(maxBani)}`)
  }
  return unwrap(
    await db
      .from('monthly_jars')
      .update({ status: 'accepted', accepted_amount_bani: answer.amountBani })
      .eq('id', jarId)
      .select()
      .single(),
  )
}

/**
 * The money leaves the user's bank and we start holding it.
 * The Stripe test-mode debit plugs in here (stripe_payment_intent_id).
 */
export async function collectJar(db: Db, jarId: string, collectedOn: string) {
  const jar = await getJar(db, jarId)
  assertStatus(jar.status, 'accepted', jarId)
  return unwrap(
    await db
      .from('monthly_jars')
      .update({ status: 'collected', collected_at: `${collectedOn}T09:00:00Z`, invest_on: oneMonthLater(collectedOn) })
      .eq('id', jarId)
      .select()
      .single(),
  )
}

/**
 * One month later: buy Pillar III units at that day's price and record the interest
 * we earned while holding the money. `investedOn` defaults to the planned date.
 */
export async function investJar(db: Db, jarId: string, investedOn?: string) {
  const jar = await getJar(db, jarId)
  assertStatus(jar.status, 'collected', jarId)
  if (!jar.collected_at || !jar.accepted_amount_bani) throw new Error(`Jar ${jarId} has no collection data`)

  const date = investedOn ?? jar.invest_on
  if (!date) throw new Error(`Jar ${jarId} has no investment date`)

  // The latest known price on or before the investment day.
  const price = unwrap(
    await db
      .from('product_prices')
      .select('unit_price_bani')
      .eq('product_id', PILLAR_THREE_PRODUCT_ID)
      .lte('date', date)
      .order('date', { ascending: false })
      .limit(1)
      .single(),
  )

  const amountBani = jar.accepted_amount_bani
  const investedAt = `${date}T09:05:00Z`
  const daysHeld = Math.max(0, Math.round((Date.parse(investedAt) - Date.parse(jar.collected_at)) / MS_PER_DAY))

  unwrap(
    await db.from('orders').insert({
      user_id: jar.user_id,
      jar_id: jar.id,
      product_id: PILLAR_THREE_PRODUCT_ID,
      amount_bani: amountBani,
      unit_price_bani: price.unit_price_bani,
      units: Math.round((amountBani / price.unit_price_bani) * 1e6) / 1e6, // fund units, not money
      executed_at: investedAt,
    }),
  )
  return unwrap(
    await db
      .from('monthly_jars')
      .update({ status: 'invested', invested_at: investedAt, float_interest_bani: floatInterestBani(amountBani, daysHeld) })
      .eq('id', jarId)
      .select()
      .single(),
  )
}
