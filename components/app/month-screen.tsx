'use client'

// Month tab: this month's counter or the month-end offer, the card payments behind it
// (last 3 months), and the history of past months (collected → with our partner → invested).
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Clock3, FastForward, Sparkles } from 'lucide-react'
import { formatFreedom, formatRon } from '@/lib/rules/lifestyle'
import type { AppData, JarSummary } from '@/lib/data/app-data'
import { answerMonthlyOffer, simulateMonthEnd } from '@/app/app/actions'
import { completeCardPayment, payMonthWithCard } from '@/app/app/card-actions'
import { Card, Header } from '@/components/app/shell'
import { PaymentHistory } from '@/components/app/payment-history'
import { DemoBank } from '@/components/bank/demo-bank'
import { getStripeJs } from '@/components/stripe/card-form'
import { monthName, shortDate, type Tab } from '@/components/app/types'

const MAX_OFFER_MULTIPLE = 2

type SavedCard = AppData['settings']['card']

function OfferCard({ jar, card }: { jar: JarSummary; card: SavedCard }) {
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [amountRon, setAmountRon] = useState(String(Math.round(jar.totalBani / 100)))
  const maxRon = Math.floor((jar.totalBani * MAX_OFFER_MULTIPLE) / 100)
  const amountBani = Math.round(Number(amountRon) * 100)
  const validAmount = amountBani > 0 && amountBani <= jar.totalBani * MAX_OFFER_MULTIPLE

  const [confirming, setConfirming] = useState(false)
  const [payError, setPayError] = useState<string>()
  const answer = (accept: boolean) =>
    startTransition(() => answerMonthlyOffer({ jarId: jar.id, accept, amountBani: accept && editing ? amountBani : undefined }))

  // With a saved card: charge it (Stripe, test mode). If the bank wants 3-D Secure,
  // Stripe shows its own screen, then the server checks the payment went through.
  const payByCard = () =>
    startTransition(async () => {
      setPayError(undefined)
      let result = await payMonthWithCard({ jarId: jar.id, amountBani: editing ? amountBani : undefined })
      if (result.status === 'requires_action') {
        const stripe = await getStripeJs()
        const confirmed = stripe ? await stripe.handleNextAction({ clientSecret: result.clientSecret }) : null
        result = confirmed && !confirmed.error ? await completeCardPayment(result.paymentIntentId) : { status: 'failed', message: confirmed?.error?.message ?? 'The bank did not confirm the payment.' }
      }
      if (result.status === 'failed') setPayError(result.message)
    })

  return (
    <Card className="border-[#ddd4fa] !bg-[#faf8ff] dark:!bg-[#241e33]">
      {confirming && (
        <DemoBank
          mode="payment"
          amount={formatRon(editing ? amountBani : jar.totalBani, { wholeRon: true })}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false)
            answer(true)
          }}
        />
      )}
      <p className="mb-3 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">{monthName(jar.month)} · end of month</p>
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#33256c] text-white">
          <Sparkles size={16} />
        </div>
        <p className="text-sm leading-6">{jar.offerMessage}</p>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4 dark:bg-[#211d2b]">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Add to your Pillar III</p>
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
        {card && (
          <p className="mt-2 text-xs text-[#858090] dark:text-[#a39cab]">
            Paid with your card {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •• {card.last4} (test mode)
          </p>
        )}
      </div>
      {payError && <p className="mt-3 rounded-xl bg-[#fdecec] px-3.5 py-2.5 text-sm text-[#b42318] dark:bg-[#3a1f24] dark:text-[#f3a4a4]">{payError}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => (card ? payByCard() : setConfirming(true))}
          disabled={pending || !validAmount}
          className="pulse-hover rounded-xl bg-[#33256c] px-3 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? (card ? 'Paying…' : 'One moment…') : 'Yes, add it'}
        </button>
        <button
          onClick={() => setEditing((value) => !value)}
          disabled={pending}
          className="pulse-hover rounded-xl bg-white px-3 py-3 text-sm font-semibold text-[#6b57bd] dark:bg-[#2b253a] dark:text-[#a594f0]"
        >
          {editing ? 'Use suggestion' : 'Another amount'}
        </button>
      </div>
      <button onClick={() => answer(false)} disabled={pending} className="mt-3 w-full text-center text-xs font-medium text-[#858090]">
        Not this month
      </button>
      <div className="mt-4 border-t border-dashed border-[#e2dfe8] pt-3 dark:border-[#353042]">
        <p className="text-xs leading-5 text-[#858090] dark:text-[#a39cab]">
          Your money stays with our banking partner for one month, then goes to your Pillar III. The interest from that month
          keeps the app free.
        </p>
        <Link href="/terms" className="pulse-hover mt-3 inline-flex w-fit items-center gap-1.5 rounded-xl bg-[#f1effa] px-3.5 py-2 text-xs font-semibold text-[#5f4bb6] dark:bg-[#2b253a] dark:text-[#a594f0]">
          Read the terms
        </Link>
      </div>
    </Card>
  )
}

function SimulateButton() {
  const [pending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => simulateMonthEnd())}
      disabled={pending}
      className="pulse-hover flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#ddd8e6] py-3 text-sm font-semibold text-[#5f4bb6] transition-colors hover:bg-[#f1effa] disabled:opacity-60 dark:border-[#353042] dark:text-[#a594f0] dark:hover:bg-[#2b253a]"
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

function ChangeLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="ml-2 text-xs font-semibold text-[#5f4bb6] underline dark:text-[#a594f0]">
      Change
    </button>
  )
}

function CurrentMonth({ jar, card, openSettings }: { jar: JarSummary; card: SavedCard; openSettings: () => void }) {
  if (jar.status === 'offered') return <OfferCard jar={jar} card={card} />

  const answered = jar.status !== 'open'
  const line = statusLine(jar)
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">{monthName(jar.month)}</p>
      <p className="mt-1 text-[28px] font-semibold tracking-[-.03em]">{formatRon(jar.acceptedAmountBani ?? jar.totalBani)}</p>
      {answered ? (
        <p className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${line.tone}`}>
          {line.icon && <line.icon size={14} />} {line.text}
        </p>
      ) : (
        <div className="mt-4 space-y-2 border-t border-dashed border-[#e2dfe8] pt-4 text-sm dark:border-[#353042]">
          <div className="flex justify-between">
            <span className="text-[#706b7b] dark:text-[#aaa4b6]">
              Round-ups
              <ChangeLink onClick={openSettings} />
            </span>
            <b>{formatRon(jar.roundupsBani)}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-[#706b7b] dark:text-[#aaa4b6]">
              Share of your salary
              <ChangeLink onClick={openSettings} />
            </span>
            <b>{formatRon(jar.salaryBani)}</b>
          </div>
          <p className="pt-1 text-xs text-[#858090] dark:text-[#a39cab]">Nothing leaves your account until you say yes at the end of the month.</p>
        </div>
      )}
    </Card>
  )
}

export function MonthScreen({ data, setTab }: { data: AppData; setTab: (tab: Tab) => void }) {
  const { currentJar, history } = data
  return (
    <div className="flex flex-col gap-4">
      <Header title="This month" subtitle="Your piggy bank" />

      {currentJar ? <CurrentMonth jar={currentJar} card={data.settings.card} openSettings={() => setTab('profile')} /> : <Card>No activity yet.</Card>}
      <SimulateButton />

      <PaymentHistory payments={data.payments} openMonth={currentJar?.month ?? null} connectBank={() => setTab('profile')} />

      {history.length > 0 && (
        <Card>
          <p className="mb-3 text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Past months</p>
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
