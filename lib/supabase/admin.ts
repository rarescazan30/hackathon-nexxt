// Admin client with the secret key: bypasses RLS. Server code and scripts only.
// Never import this from a client component. SUPABASE_SECRET_KEY has no NEXT_PUBLIC_
// prefix, so it is never sent to the browser; there it would be undefined and throw.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY')
  }

  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
