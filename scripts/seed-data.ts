// Fixed demo data for `npm run seed`. Fictional only: no real people, IBANs or accounts.
// Money in integer bani. Prices are illustrative snapshots, not real quotes.
import { PRODUCT_CATALOG } from '../lib/rules'
import type { Database } from '../lib/supabase/database.types'

type ProductRow = Database['public']['Tables']['products']['Insert']

// The 6 months of history; the last one is the current, still open month.
export const MONTHS = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']
export const CURRENT_MONTH = MONTHS[MONTHS.length - 1]

// Plan v2 has one product: Pillar III.
export const PRODUCTS: ProductRow[] = [
  {
    id: PRODUCT_CATALOG.pillar3.id,
    name: 'Pillar III (voluntary pension)',
    type: 'pillar3',
    risk_level: 'medium',
    provider: 'ASF-authorised voluntary pension fund',
    description: 'Voluntary private pension fund, tax-deductible up to 400 EUR a year.',
    source_url: 'https://asfromania.ro',
  },
]

// Unit price on the 1st of each month, from 2026-05-01 to 2026-10-01 (bani per unit).
export const PRICE_DATES = MONTHS.map((month) => `${month}-01`)
export const UNIT_PRICES_BANI: Record<string, number[]> = {
  pillar3: [2580, 2595, 2612, 2604, 2631, 2650],
}

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

export interface SeedTransaction {
  external_id: string
  booked_at: string
  amount_bani: number
  counterparty: string
  description: string
  is_card_payment: boolean
}

/**
 * The month's transactions: rent, utilities, salary and card payments.
 * Deterministic: running the seed twice gives the same rows.
 * The current month's salary comes from data/personas/andrei.json instead.
 */
export function transactionsForMonth(month: string, monthIndex: number, salaryBani: number): SeedTransaction[] {
  const id = (n: number) => `tx-andrei-${month.replace('-', '')}-${String(n).padStart(2, '0')}`
  const day = (d: number) => `${month}-${String(d).padStart(2, '0')}`
  const monthName = MONTH_NAMES[Number(month.slice(5)) - 1]

  const rows: SeedTransaction[] = [
    { external_id: id(1), booked_at: day(1), amount_bani: -180000, counterparty: 'Landlord', description: 'Rent', is_card_payment: false },
    { external_id: id(2), booked_at: day(5), amount_bani: -23400, counterparty: 'Enel Energie', description: 'Electricity bill', is_card_payment: false },
  ]
  if (month !== CURRENT_MONTH) {
    rows.push({ external_id: id(3), booked_at: day(15), amount_bani: salaryBani, counterparty: 'Tech Solutions SRL', description: `Salary ${monthName} 2026`, is_card_payment: false })
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
  return rows
}
