// /admin: company numbers (users, money held, interest earned, a revenue projection).
// Only for the admin account (ADMIN_EMAIL); anyone else gets a 404. Totals only.
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { ArrowLeft } from 'lucide-react'
import { getAdminStats } from '@/lib/data/admin-stats'
import { FLOAT_INTEREST_RATE, formatRon } from '@/lib/rules'
import { isAdminEmail } from '@/lib/server/admin'
import { createClient } from '@/lib/supabase/server'
import { Card, Logo } from '@/components/app/shell'
import { monthName } from '@/components/app/types'
import { RevenueProjection } from './revenue-projection'

export const metadata: Metadata = {
  title: 'zile. — Admin',
  robots: { index: false },
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4 px-5 pb-16 pt-6">
        <nav className="flex items-center justify-between">
          <Logo />
          <Link href="/app" className="flex items-center gap-1.5 text-sm font-semibold text-[#5f4bb6] dark:text-[#a594f0]">
            <ArrowLeft size={15} /> Back to the app
          </Link>
        </nav>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[24px] bg-[#e8e2fb]/60 dark:bg-[#2b253a]/60" />}>
          <AdminDashboard />
        </Suspense>
      </div>
    </main>
  )
}

const EYEBROW = 'text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]'

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card>
      <p className={EYEBROW}>{label}</p>
      <p className="mt-2 text-[28px] font-semibold tracking-[-.03em]">{value}</p>
      {note && <p className="mt-1 text-xs text-[#858090] dark:text-[#a39cab]">{note}</p>}
    </Card>
  )
}

async function AdminDashboard() {
  await connection() // live numbers on every request
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!isAdminEmail(auth.user?.email)) notFound()

  const stats = await getAdminStats()
  const maxMonth = Math.max(1, ...stats.interest.byMonth.map((row) => row.bani))

  return (
    <>
      <header className="px-1 pb-2 pt-6">
        <p className={EYEBROW}>Admin</p>
        <h1 className="text-[27px] font-semibold tracking-[-.04em]">How zile. is doing</h1>
        <p className="mt-2 text-sm text-[#706b7b] dark:text-[#aaa4b6]">
          We earn the interest on each month&rsquo;s money while our partner holds it (assumed {FLOAT_INTEREST_RATE * 100}% a year).
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Users" value={String(stats.users.registered)} note={`${stats.users.onboarded} finished onboarding · ${stats.users.cardLinked} with a card`} />
        <Stat label="Money held now" value={formatRon(stats.heldNowBani, { wholeRon: true })} note="Accepted, not yet in Pillar III" />
        <Stat label="Interest earned" value={formatRon(stats.interest.totalBani)} note={`${formatRon(stats.interest.thisMonthBani)} this month`} />
        <Stat label="Contributions" value={String(stats.contributions.count)} note={`${formatRon(stats.contributions.totalBani, { wholeRon: true })} in total`} />
        <Stat label="Average contribution" value={formatRon(stats.contributions.averageBani, { wholeRon: true })} note="per accepted month" />
        <Stat label="Offers accepted" value={`${Math.round(stats.acceptanceRate * 100)}%`} note="of answered month-end offers" />
      </div>

      <Card>
        <p className={EYEBROW}>Interest per month</p>
        {stats.interest.byMonth.length === 0 ? (
          <p className="mt-3 text-sm text-[#858090]">No interest yet: it is earned when held money goes on to Pillar III.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {stats.interest.byMonth.map((row) => (
              <li key={row.month} className="grid grid-cols-[110px_1fr_90px] items-center gap-3 text-sm">
                <span className="text-[#706b7b] dark:text-[#aaa4b6]">{monthName(row.month)}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-[#f1effa] dark:bg-[#2b253a]">
                  <span className="block h-full rounded-full bg-[#6f5cc1]" style={{ width: `${(row.bani / maxMonth) * 100}%` }} />
                </span>
                <b className="text-right tabular-nums">{formatRon(row.bani)}</b>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <RevenueProjection averageBani={stats.contributions.averageBani} acceptanceRate={stats.acceptanceRate} />
    </>
  )
}
