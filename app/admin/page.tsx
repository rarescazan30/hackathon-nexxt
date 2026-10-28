// /admin: company numbers (revenue, money held, savers, money brought to Pillar III,
// growth per month and a revenue projection).
// Only for the admin account (ADMIN_EMAIL); anyone else gets a 404. Totals only.
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { ArrowLeft } from 'lucide-react'
import { getAdminStats, type MonthPoint } from '@/lib/data/admin-stats'
import { FLOAT_INTEREST_RATE, formatRon } from '@/lib/rules'
import { isAdminEmail } from '@/lib/server/admin'
import { createClient } from '@/lib/supabase/server'
import { Card, Logo } from '@/components/app/shell'
import { RevenueProjection } from './revenue-projection'

export const metadata: Metadata = {
  title: 'LifeGrowth — Admin',
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

function Stat({ label, value, note, highlight = false }: { label: string; value: string; note?: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? '!bg-[#33256c] text-white dark:!bg-[#2a2147]' : ''}>
      <p className={highlight ? 'text-xs font-medium uppercase tracking-[.18em] text-[#c9bff0]' : EYEBROW}>{label}</p>
      <p className="mt-2 text-[28px] font-semibold tracking-[-.03em] tabular-nums">{value}</p>
      {note && <p className={`mt-1 text-xs ${highlight ? 'text-[#d9d2f5]' : 'text-[#858090] dark:text-[#a39cab]'}`}>{note}</p>}
    </Card>
  )
}

/** A simple horizontal bar per month. */
function BarChart({ title, points, format, empty }: { title: string; points: MonthPoint[]; format: (value: number) => string; empty?: string }) {
  const max = Math.max(1, ...points.map((point) => point.value))
  return (
    <Card>
      <p className={EYEBROW}>{title}</p>
      {points.length === 0 ? (
        <p className="mt-3 text-sm text-[#858090]">{empty ?? 'No data yet.'}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {points.map((point) => (
            <li key={point.month} className="grid grid-cols-[72px_1fr_96px] items-center gap-3 text-sm">
              <span className="text-[#706b7b] dark:text-[#aaa4b6]">{shortMonth(point.month)}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-[#f1effa] dark:bg-[#2b253a]">
                <span className="block h-full rounded-full bg-[#6f5cc1]" style={{ width: `${(point.value / max) * 100}%` }} />
              </span>
              <b className="text-right tabular-nums">{format(point.value)}</b>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/** '2026-10' → 'Oct 2026' */
function shortMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

async function AdminDashboard() {
  await connection() // live numbers on every request
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!isAdminEmail(auth.user?.email)) notFound()

  const stats = await getAdminStats()

  return (
    <>
      <header className="px-1 pb-2 pt-6">
        <p className={EYEBROW}>Admin</p>
        <h1 className="text-[27px] font-semibold tracking-[-.04em]">How LifeGrowth is doing</h1>
        <p className="mt-2 text-sm text-[#706b7b] dark:text-[#aaa4b6]">
          We earn the interest on each month&rsquo;s money while our partner holds it (assumed {FLOAT_INTEREST_RATE * 100}% a year).
        </p>
      </header>

      {/* The business in three numbers. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue this month" value={formatRon(stats.interest.thisMonthBani, { wholeRon: true })} note={`${formatRon(stats.interest.totalBani, { wholeRon: true })} since launch`} highlight />
        <Stat label="Annual run-rate" value={formatRon(stats.annualRunRateBani, { wholeRon: true })} note="this month × 12" highlight />
        <Stat label="Money held now" value={formatRon(stats.heldNowBani, { wholeRon: true })} note="earning interest until it goes to Pillar III" highlight />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Savers" value={stats.savers.toLocaleString('en-US')} note={`+${stats.newMembersThisMonth} new this month (+${Math.round(stats.memberGrowth * 100)}%) · ${stats.users.registered} accounts`} />
        <Stat label="Brought to Pillar III" value={formatRon(stats.broughtToPillarThreeBani, { wholeRon: true })} note="all money added through us" />
        <Stat label="Average month" value={formatRon(stats.averageContributionBani, { wholeRon: true })} note={`per saver · ${Math.round(stats.acceptanceRate * 100)}% of offers accepted`} />
        <Stat label="Revenue per saver" value={formatRon(stats.revenuePerSaverYearBani, { wholeRon: true })} note="a year, at today's pace" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChart title="Members" points={stats.membersByMonth} format={(value) => value.toLocaleString('en-US')} />
        <BarChart title="Money added per month" points={stats.contributionsByMonth} format={(value) => formatRon(value, { wholeRon: true })} />
      </div>
      <BarChart title="Revenue per month (interest)" points={stats.interest.byMonth} format={(value) => formatRon(value, { wholeRon: true })} empty="No interest yet: it is earned when held money goes on to Pillar III." />

      <RevenueProjection averageBani={stats.averageContributionBani} acceptanceRate={stats.acceptanceRate} />
    </>
  )
}
