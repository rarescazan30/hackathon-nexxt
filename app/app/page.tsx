import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getAppData } from '@/lib/data/app-data'
import { AppShell } from '@/components/app/app-shell'

export const metadata: Metadata = {
  title: 'zile. — Home',
}

// Logged-in users only: proxy.ts sends everyone else to /login.
export default function AppPage() {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <AppLoader />
    </Suspense>
  )
}

// Reads the session and the user's rows, so it renders per request inside Suspense.
async function AppLoader() {
  await connection() // per-request data: never prerender (Supabase reads the clock)
  const { data, onboardingCompleted } = await getAppData()
  if (!onboardingCompleted || !data) redirect('/onboarding')
  return <AppShell data={data} />
}

function AppSkeleton() {
  return (
    <main className="min-h-screen bg-[#f7f6f9] dark:bg-[#18151f]">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-5 pt-6">
        <div className="h-14 w-40 animate-pulse rounded-2xl bg-[#e8e2fb]/60 dark:bg-[#2b253a]/60" />
        <div className="h-36 animate-pulse rounded-[24px] bg-[#e8e2fb]/60 dark:bg-[#2b253a]/60" />
        <div className="aspect-square animate-pulse rounded-[24px] bg-[#e8e2fb]/60 dark:bg-[#2b253a]/60" />
      </div>
    </main>
  )
}
