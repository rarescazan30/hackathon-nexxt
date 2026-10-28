'use client'

// Month tab: this month's counter or the month-end offer, the round-ups behind it, and
// the history of past months (collected → with our partner → invested).
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Clock3, FastForward, Sparkles } from 'lucide-react'
import { formatFreedom, formatRon } from '@/lib/rules/lifestyle'
import type { AppData, JarSummary } from '@/lib/data/app-data'
import { answerMonthlyOffer, simulateMonthEnd } from '@/app/app/actions'
import { Card, Header } from '@/components/app/shell'
import { monthName, shortDate } from '@/components/app/types'

const MAX_OFFER_MULTIPLE = 2

function OfferCard({ jar }: { jar: JarSummary }) {
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [amountRon, setAmountRon] = useState(String(Math.round(jar.totalBani / 100)))
  const maxRon = Math.floor((jar.totalBani * MAX_OFFER_MULTIPLE) / 100)
  const amountBani = Math.round(Number(amountRon) * 100)
  const validAmount = amountBani > 0 && amountBani <= jar.totalBani * MAX_OFFER_MULTIPLE

  const answer = (accept: boolean) =>
    startTransition(() => answerMonthlyOffer({ jarId: jar.id, accept, amountBani: accept && editing ? amountBani : undefined }))

  return (
    <Card className="border-[#ddd4fa] !bg-[#faf8ff] dark:!bg-[#241e33]">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#33256c] text-white">
          <Sparkles size={16} />
        </div>
        <p className="text-sm leading-6">{jar.offerMessage}</p>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4 dark:bg-[#211d2b]">
        <p className="text-[11px] font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Add to your Pillar III</p>
        {editing ? (
          <label className="mt-2 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={maxRon}
              value={amountRon}
              onChange={(e) => setAmountRon(e.target.value)}
              className="w-32 rounded-xl border border-[#e2dfe8] bg-[#f1effa]/40 px-3 py-2 text-xl font-semibold outline-none focus:border-[#6f5cc1] dark:border-[#353042] dark:bg-[#2b253a]/40"
            />
            <span className="text-xl font-semibold">RON</span>
            <span className="ml-auto text-xs text-[#858090]">max {maxRon} RON</span>
          </label>
        ) : (
          <p className="mt-1 text-[28px] font-semibold tracking-[-.03em]">{formatRon(jar.totalBani, { wholeRon: true })}</p>
        )}
        <p className="mt-1 text-xs font-semibold text-[#438565] dark:text-[#6bc495]">+{formatFreedom(jar.daysAdded)} of freedom</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => answer(true)}
          disabled={pending || !validAmount}
          className="rounded-xl bg-[#33256c] px-3 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'One moment…' : 'Yes, add it'}
        </button>
        <button
          onClick={() => setEditing((value) => !value)}
          disabled={pending}
          className="rounded-xl bg-white px-3 py-3 text-sm font-semibold text-[#6b57bd] dark:bg-[#2b253a] dark:text-[#a594f0]"
        >
          {editing ? 'Use suggestion' : 'Another amount'}
        </button>
      </div>
      <button onClick={() => answer(false)} disabled={pending} className="mt-3 w-full text-center text-xs font-medium text-[#858090]">
        Not this month
      </button>
      <p className="mt-4 border-t border-dashed border-[#e2dfe8] pt-3 text-[11px] leading-5 text-[#858090] dark:border-[#353042] dark:text-[#a39cab]">
        Your money stays with our banking partner for one month, then goes to your Pillar III. The interest from that month
        keeps the app free.{' '}
        <Link href="/terms" className="font-semibold text-[#5f4bb6] underline dark:text-[#a594f0]">
          Terms
        </Link>
      </p>
    </Card>
  )
}

function SimulateButton() {
  const [pending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => simulateMonthEnd())}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#ddd8e6] py-3 text-sm font-semibold text-[#5f4bb6] transition-colors hover:bg-[#f1effa] disabled:opacity-60 dark:border-[#353042] dark:text-[#a594f0] dark:hover:bg-[#2b253a]"
    >
      <FastForward size={16} />
      {pending ? 'Closing the month…' : 'Simulate end of month (demo)'}
    </button>
  )
}

function statusLine(jar: JarSummary) {
  switch (jar.status) {
    case 'invested':
      return { icon: Check, text: 'In your Pillar III', tone: 'text-[#438565] dark:text-[#6bc495]' }
    case 'collected':
    case 'accepted':
      return { icon: Clock3, text: jar.investOn ? `With our partner until ${shortDate(jar.investOn)}` : 'With our partner', tone: 'text-[#5f4bb6] dark:text-[#a594f0]' }
    case 'declined':
      return { icon: null, text: 'Skipped', tone: 'text-[#858090]' }
    default:
      return { icon: null, text: 'Not answered', tone: 'text-[#858090]' }
  }
}

function CurrentMonth({ jar }: { jar: JarSummary }) {
  if (jar.status === 'offered') return <OfferCard jar={jar} />

  const answered = jar.status !== 'open'
  const line = statusLine(jar)
  return (
    <Card>
      <p className="text-[11px] font-medium uppercase tracking-[.18em] text-[#8c7ad9]">{monthName(jar.month)}</p>
      <p className="mt-1 text-[28px] font-semibold tracking-[-.03em]">{formatRon(jar.acceptedAmountBani ?? jar.totalBani)}</p>
      {answered ? (
        <p className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${line.tone}`}>
          {line.icon && <line.icon size={14} />} {line.text}
        </p>
      ) : (
        <div className="mt-4 space-y-2 border-t border-dashed border-[#e2dfe8] pt-4 text-sm dark:border-[#353042]">
          <div className="flex justify-between">
            <span className="text-[#706b7b] dark:text-[#aaa4b6]">Round-ups</span>
            <b>{formatRon(jar.roundupsBani)}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-[#706b7b] dark:text-[#aaa4b6]">Share of your salary</span>
            <b>{formatRon(jar.salaryBani)}</b>
          </div>
          <p className="pt-1 text-xs text-[#858090] dark:text-[#a39cab]">Nothing leaves your account until you say yes at the end of the month.</p>
        </div>
      )}
    </Card>
  )
}

export function MonthScreen({ data }: { data: AppData }) {
  const { currentJar, roundups, history } = data
  return (
    <div className="flex flex-col gap-4">
      <Header title="This month" subtitle="Your piggy bank" />

      {currentJar ? <CurrentMonth jar={currentJar} /> : <Card>No activity yet.</Card>}
      <SimulateButton />

      {roundups.length > 0 && currentJar?.status === 'open' && (
        <Card>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Round-ups</p>
          <ul className="divide-y divide-dashed divide-[#e2dfe8] dark:divide-[#353042]">
            {roundups.map((roundup) => (
              <li key={roundup.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{roundup.counterparty}</p>
                  <p className="text-xs text-[#858090] dark:text-[#a39cab]">
                    {shortDate(roundup.date)} · {formatRon(roundup.spentBani)}
                  </p>
                </div>
                <span className="font-semibold text-[#438565] dark:text-[#6bc495]">+{formatRon(roundup.roundupBani)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Past months</p>
          <ul className="divide-y divide-dashed divide-[#e2dfe8] dark:divide-[#353042]">
            {history.map((jar) => {
              const line = statusLine(jar)
              return (
                <li key={jar.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{monthName(jar.month)}</p>
                    <p className={`flex items-center gap-1 text-xs ${line.tone}`}>
                      {line.icon && <line.icon size={12} />} {line.text}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{jar.acceptedAmountBani ? formatRon(jar.acceptedAmountBani, { wholeRon: true }) : '—'}</p>
                    {jar.acceptedAmountBani ? <p className="text-xs text-[#438565] dark:text-[#6bc495]">+{formatFreedom(jar.daysAdded)}</p> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
