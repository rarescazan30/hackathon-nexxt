import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export const metadata: Metadata = {
  title: 'zile. — Get started',
}

// Logged-in users only (proxy.ts). Users who finished onboarding go straight to /app.
export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7f6f9] dark:bg-[#18151f]" />}>
      <OnboardingLoader />
    </Suspense>
  )
}

async function OnboardingLoader() {
  await connection() // per-request data: never prerender (Supabase reads the clock)
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, onboarding_completed').single()
  if (profile?.onboarding_completed) redirect('/app')

  const firstName = (profile?.full_name ?? 'there').split(' ')[0]
  return <OnboardingFlow firstName={firstName} />
}
