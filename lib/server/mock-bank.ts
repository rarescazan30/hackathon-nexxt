// Mock bank sync (NextGenPSD2-like rows): what "connect your card" imports in the demo.
// Deterministic, fictional data: the same month always gives the same transactions.
// Relative imports only, so scripts/seed.ts can use this with jiti.

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
