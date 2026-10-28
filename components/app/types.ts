export type Tab = 'home' | 'agent' | 'progress' | 'profile'

// Formats a lei amount Romanian style: 1.293,50 lei
export const money = (n: number) => `${n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`
