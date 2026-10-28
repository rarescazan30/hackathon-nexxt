// The three tabs of the app (docs/plan.md, section 6).
export type Tab = 'home' | 'month' | 'profile'

/** '2026-10' → 'October 2026' */
export function monthName(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** '2026-11-01' → '1 Nov' */
export function shortDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
