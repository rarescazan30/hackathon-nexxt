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

// The month's mock bank transactions come from lib/server/mock-bank.ts (also used when
// a new user "connects their card" in onboarding).
export { transactionsForMonth } from '../lib/server/mock-bank'
