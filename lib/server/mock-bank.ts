// Mock bank sync (NextGenPSD2-like rows): what "connect your card" imports in the demo.
// Deterministic, fictional data: the same month always gives the same transactions.
// Relative imports only, so scripts/seed.ts can use this with jiti.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/database.types'
import { unwrap } from './unwrap'

// Card payments repeated every month. The amount changes a little from month to month.
const CARD_PAYMENTS: { counterparty: string; description: string; baseBani: number }[] = [
  { counterparty: 'Lidl', description: 'Groceries', baseBani: 14320 },
  { counterparty: 'Bolt', description: 'Transport', baseBani: 2370 },
  { counterparty: 'Glovo', description: 'Food delivery', baseBani: 5490 },
  { counterparty: 'Kaufland', description: 'Groceries', baseBani: 21150 },
  { counterparty: 'Farmacia Tei', description: 'Pharmacy', baseBani: 4380 },
  { counterparty: 'Cinema City', description: 'Cinema', baseBani: 3800 },
  { counterparty: 'Starbucks', description: 'Coffee', baseBani: 1890 },
  { counterparty: 'Uber', description: 'Transport', baseBani: 3140 },
  { counterparty: 'Carrefour', description: 'Groceries', baseBani: 9760 },
  { counterparty: 'Netflix', description: 'Subscription', baseBani: 4999 },
  { counterparty: 'Decathlon', description: 'Sport', baseBani: 12990 },
  { counterparty: 'Mega Image', description: 'Groceries', baseBani: 6720 },
]

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December']

export interface MockTransaction {
  external_id: string
  booked_at: string
  amount_bani: number
  counterparty: string
  description: string
  is_card_payment: boolean
}

/**
 * One month of transactions: rent, electricity, salary (optional) and 12 card payments.
 * Card payments are spread every 2 days from the 2nd; `untilDay` drops the ones after it
 * (for the current month, only what has already happened).
 */
export function transactionsForMonth(
  month: string,
  monthIndex: number,
  salaryBani: number,
  options: { includeSalary?: boolean; untilDay?: number; idPrefix?: string } = {},
): MockTransaction[] {
  const { includeSalary = true, untilDay = 31, idPrefix = 'tx-andrei' } = options
  const id = (n: number) => `${idPrefix}-${month.replace('-', '')}-${String(n).padStart(2, '0')}`
  const day = (d: number) => `${month}-${String(d).padStart(2, '0')}`
  const monthName = MONTH_NAMES[Number(month.slice(5)) - 1]

  const rows: MockTransaction[] = [
    { external_id: id(1), booked_at: day(1), amount_bani: -180000, counterparty: 'Landlord', description: 'Rent', is_card_payment: false },
    { external_id: id(2), booked_at: day(5), amount_bani: -23400, counterparty: 'Enel Energie', description: 'Electricity bill', is_card_payment: false },
  ]
  if (includeSalary && salaryBani > 0) {
    rows.push({ external_id: id(3), booked_at: day(15), amount_bani: salaryBani, counterparty: 'Employer', description: `Salary ${monthName}`, is_card_payment: false })
  }

  CARD_PAYMENTS.forEach((payment, k) => {
    const variationBani = ((monthIndex * 7 + k * 3) % 11) * 47
    rows.push({
      external_id: id(10 + k),
      booked_at: day(2 + k * 2),
      amount_bani: -(payment.baseBani + variationBani),
      counterparty: payment.counterparty,
      description: payment.description,
      is_card_payment: true,
    })
  })
  return rows.filter((row) => Number(row.booked_at.slice(8)) <= untilDay)
}

/** Each user's mock rows get their own ids, so importing a month twice adds nothing. */
export function mockIdPrefix(userId: string) {
  return `tx-${userId.slice(0, 8)}`
}

/**
 * "The bank sync" of the demo: saves one month of mock transactions for a user.
 * Rows that already exist (same external id) are skipped.
 */
export async function importMockMonth(
  db: SupabaseClient<Database>,
  userId: string,
  month: string,
  salaryBani: number,
  options: { untilDay?: number; includeSalary?: boolean } = {},
) {
  const rows = transactionsForMonth(month, Number(month.slice(5)) - 1, salaryBani, { ...options, idPrefix: mockIdPrefix(userId) })
    // Every row needs the same keys: in a bulk insert, a missing key becomes null, not the default.
    .map((row) => ({ ...row, currency: 'RON', user_id: userId }))
  unwrap(await db.from('transactions').upsert(rows, { onConflict: 'user_id,external_id', ignoreDuplicates: true }))
}

/** How far back a new bank connection reads, like a real PSD2 consent (90 days ≈ 3 months). */
export const HISTORY_MONTHS = 3

function addMonths(month: string, delta: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1))
  return date.toISOString().slice(0, 7)
}

/**
 * "Connect your bank": the bank sends the last 3 months of payments plus this month so far.
 * `month` is the user's current month (a simulated month can be ahead of the real date).
 */
export async function importBankHistory(db: SupabaseClient<Database>, userId: string, month: string, salaryBani: number) {
  for (let back = HISTORY_MONTHS; back >= 1; back--) {
    await importMockMonth(db, userId, addMonths(month, -back), salaryBani)
  }
  const now = new Date()
  const isRealMonth = month === now.toISOString().slice(0, 7)
  await importMockMonth(db, userId, month, salaryBani, { untilDay: isRealMonth ? now.getUTCDate() : 31 })
}
