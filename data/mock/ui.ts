// UI mock data for the v0 prototype screens. Replace with API data as routes land.
import type { RiskLevel } from '@/lib/contracts'

export const user = {
  name: 'Andrei', age: 26, salary: 4500, yearsWorked: 3, risk: 'medium' as RiskLevel,
  pillarTwo: 8200, roundUps: 74, payday: 135, days: 326, range: [290, 370] as const,
}

export const activity = [
  { label: 'Salary → 3% set aside', detail: 'Payday · today', amount: '+135 lei', icon: 'salary' },
  { label: 'Coffee · 12,30 lei', detail: 'Round-up · yesterday', amount: '+2,70 lei', icon: 'coffee' },
  { label: 'Groceries · 86,40 lei', detail: 'Round-up · yesterday', amount: '+3,60 lei', icon: 'cart' },
]

export const monthlyHistory = [
  { month: 'October 2026', amount: 209, destination: 'Pillar 3 + ETF BET', days: 14 },
  { month: 'September 2026', amount: 183, destination: 'Pillar 3 + ETF BET', days: 12 },
  { month: 'August 2026', amount: 197, destination: 'Pillar 3 + ETF BET', days: 13 },
  { month: 'July 2026', amount: 156, destination: 'Pillar 3', days: 10 },
  { month: 'June 2026', amount: 142, destination: 'Pillar 3', days: 9 },
  { month: 'May 2026', amount: 178, destination: 'Pillar 3 + ETF BET', days: 11 },
]

export const projection = Array.from({ length: 13 }, (_, i) => ({
  age: 26 + i * 3, pessimistic: 326 + i * 92, base: 326 + i * 145, optimistic: 326 + i * 220,
}))

export const allocation = [
  { label: 'State pension', value: '1.840 lei', percent: 48, color: 'bg-[#33256c]' },
  { label: 'Pillar 2', value: '1.020 lei', percent: 27, color: 'bg-[#8c7ad9]' },
  { label: 'Pillar 3', value: '540 lei', percent: 14, color: 'bg-[#d7cfff]' },
  { label: 'Investments', value: '290 lei', percent: 8, color: 'bg-[#f0b583]' },
  { label: 'Round-ups', value: '110 lei', percent: 3, color: 'bg-[#f5d6b8]' },
]
