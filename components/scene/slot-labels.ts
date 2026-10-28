// What each slot shows at each tier, in words. Used by the 2D fallback and by the UI
// ("Next: an old car", "Level 11: you eat out now!").
import type { Slot } from '@/lib/rules/lifestyle'

export const SLOT_LABELS: Record<Slot, [string, string, string, string, string]> = {
  home: ['A tent', 'A small rented flat', 'A family house', 'A modern house', 'A villa'],
  transport: ['The bus', 'A bike', 'An old car', 'A newer car', 'A luxury car'],
  food: ['Canned food', 'Simple home cooking', 'Good groceries', 'Eating out', 'A private chef'],
  extras: ['Nothing extra', 'An old TV', 'A garden', 'A garden with a swing', 'A pool'],
}

export const SLOT_NAMES: Record<Slot, string> = {
  home: 'Home',
  transport: 'Transport',
  food: 'Food',
  extras: 'Extras',
}

export function slotLabel(slot: Slot, tier: number): string {
  return SLOT_LABELS[slot][Math.min(5, Math.max(1, tier)) - 1]
}
