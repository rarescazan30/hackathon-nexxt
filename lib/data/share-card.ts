// Reads one public "Share my island" card for /i/<code>. Server only: the table has no
// public read policy, so this uses the admin client and returns only what may be shown.
import { SLOTS, type SlotTiers } from '@/lib/rules/lifestyle'
import { createAdminClient } from '@/lib/supabase/admin'

const CODE_PATTERN = /^[A-Za-z0-9]{6,20}$/

export interface ShareCard {
  firstName: string
  level: number
  slots: SlotTiers
  /** Public URL of the preview picture, or null if there isn't one. */
  imageUrl: string | null
}

export async function getShareCard(code: string): Promise<ShareCard | null> {
  if (!CODE_PATTERN.test(code)) return null
  const db = createAdminClient()
  const { data } = await db
    .from('share_links')
    .select('first_name, level, slots, image_path, updated_at')
    .eq('code', code)
    .maybeSingle()
  if (!data) return null

  // Only the four known slots, each a tier 1..5, whatever is stored.
  const stored = (data.slots ?? {}) as Record<string, unknown>
  const slots = Object.fromEntries(
    SLOTS.map((slot) => [slot, Math.min(5, Math.max(1, Number(stored[slot]) || 1))]),
  ) as SlotTiers

  const imageUrl = data.image_path
    ? `${db.storage.from('share-images').getPublicUrl(data.image_path).data.publicUrl}?v=${Date.parse(data.updated_at)}`
    : null
  return { firstName: data.first_name, level: data.level, slots, imageUrl }
}
