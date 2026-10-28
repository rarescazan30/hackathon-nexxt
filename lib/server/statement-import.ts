// Bank statement PDF → transactions, the fallback for people without a bank connection.
// A payment we already have (from the bank connection or an earlier upload) is skipped:
// same day + same amount + same first word of the merchant ("LIDL 0123 BUC" = "Lidl").
// Server only (admin client).
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StatementTransaction } from '../ai/extract-document'
import type { Database } from '../supabase/database.types'
import { roundUp } from '../rules'
import { rebuildJar } from './jar'
import { unwrap } from './unwrap'

type Db = SupabaseClient<Database>

/** "LIDL 0123 BUCURESTI" → "lidl", "Mega Image" → "mega". */
function merchantKey(name: string | null) {
  return (name ?? '').toLowerCase().match(/[a-zăâîșşțţ]+/)?.[0] ?? ''
}

function paymentKey(date: string, amountBani: number, merchant: string | null) {
  return `${date}|${amountBani}|${merchantKey(merchant)}`
}

export interface StatementImportResult {
  /** Transactions on the statement. */
  found: number
  /** Card payments on it (the ones that give round-ups). */
  cardPayments: number
  added: number
  /** Already known: from the bank connection or an earlier upload. */
  skipped: number
  /** Round-ups the new payments add to the open month. */
  roundupBani: number
}

export async function importStatementTransactions(db: Db, userId: string, transactions: StatementTransaction[]): Promise<StatementImportResult> {
  const dates = transactions.map((t) => t.date).sort()
  const existing = unwrap(
    await db
      .from('transactions')
      .select('booked_at, amount_bani, counterparty')
      .eq('user_id', userId)
      .gte('booked_at', dates[0])
      .lte('booked_at', dates[dates.length - 1]),
  )
  const known = new Set(existing.map((row) => paymentKey(row.booked_at, row.amount_bani, row.counterparty)))

  const fresh = transactions.filter((t) => {
    const key = paymentKey(t.date, t.amountBani, t.merchant)
    if (known.has(key)) return false
    known.add(key) // the same line twice on one statement counts once
    return true
  })

  if (fresh.length > 0) {
    unwrap(
      await db.from('transactions').upsert(
        fresh.map((t) => ({
          user_id: userId,
          // Same payment → same id, so uploading the statement again adds nothing.
          external_id: `pdf-${createHash('sha256').update(paymentKey(t.date, t.amountBani, t.merchant)).digest('hex').slice(0, 24)}`,
          booked_at: t.date,
          amount_bani: t.amountBani,
          currency: 'RON',
          counterparty: t.merchant,
          description: 'From a bank statement (PDF)',
          is_card_payment: t.isCardPayment,
        })),
        { onConflict: 'user_id,external_id', ignoreDuplicates: true },
      ),
    )
  }

  // Only the open month's round-ups change: answered months stay as they were.
  const [profile, latest] = await Promise.all([
    db.from('profiles').select('roundup_rule_bani, roundup_multiplier').eq('id', userId).single().then(unwrap),
    db.from('monthly_jars').select('month, status').eq('user_id', userId).order('month', { ascending: false }).limit(1).then(unwrap),
  ])
  const openMonth = latest[0] && (latest[0].status === 'open' || latest[0].status === 'offered') ? latest[0].month : null
  if (openMonth) await rebuildJar(db, userId, openMonth)

  const roundupBani = fresh
    .filter((t) => t.isCardPayment && t.amountBani < 0 && openMonth !== null && t.date.startsWith(openMonth))
    .reduce((sum, t) => sum + roundUp(-t.amountBani, { stepBani: profile.roundup_rule_bani, multiplier: profile.roundup_multiplier }), 0)

  return {
    found: transactions.length,
    cardPayments: transactions.filter((t) => t.isCardPayment).length,
    added: fresh.length,
    skipped: transactions.length - fresh.length,
    roundupBani,
  }
}
