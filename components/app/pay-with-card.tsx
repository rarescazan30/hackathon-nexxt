'use client'

// The live demo moment on the Month tab: "pay" at a shop with the demo card and watch the
// round-up land in this month's counter. Without a connected card, it connects one first.
import { useState, useTransition } from 'react'
import { CreditCard } from 'lucide-react'
import { formatRon } from '@/lib/rules/lifestyle'
import { connectCard, payWithCard } from '@/app/app/actions'
import { Card } from '@/components/app/shell'
import { DEMO_ACCOUNT, DemoBank } from '@/components/bank/demo-bank'

// Ready-made payments, so the demo is one tap.
const QUICK_PAYMENTS = [
  { counterparty: 'Starbucks', amountBani: 1230 },
  { counterparty: 'Lidl', amountBani: 8745 },
  { counterparty: 'Bolt', amountBani: 2160 },
  { counterparty: 'Glovo', amountBani: 4390 },
]

export function PayWithCard({ cardLinked }: { cardLinked: boolean }) {
  const [pending, startTransition] = useTransition()
  const [connecting, setConnecting] = useState(false)
  const [shop, setShop] = useState('')
  const [amountRon, setAmountRon] = useState('')
  const [last, setLast] = useState<{ counterparty: string; amountBani: number; roundupBani: number }>()

  function pay(counterparty: string, amountBani: number) {
    startTransition(async () => {
      const { roundupBani } = await payWithCard({ counterparty, amountBani })
      setLast({ counterparty, amountBani, roundupBani })
      setShop('')
      setAmountRon('')
    })
  }

  const customAmountBani = Math.round(Number(amountRon.replace(',', '.')) * 100)
  const customValid = shop.trim().length > 0 && customAmountBani > 0 && customAmountBani <= 1_000_000

  if (!cardLinked) {
    return (
      <Card className="flex flex-col gap-3">
        {connecting && (
          <DemoBank
            mode="consent"
            onClose={() => setConnecting(false)}
            onConfirm={() => {
              setConnecting(false)
              startTransition(() => connectCard())
            }}
          />
        )}
        <p className="text-sm font-semibold">Connect your card to see round-ups</p>
        <p className="text-xs text-[#858090] dark:text-[#a39cab]">We only read your card payments. Nothing moves without your yes.</p>
        <button
          onClick={() => setConnecting(true)}
          disabled={pending}
          className="pulse-hover flex items-center justify-center gap-2 rounded-xl bg-[#33256c] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <CreditCard size={16} /> {pending ? 'Connecting…' : 'Connect your card'}
        </button>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Pay with card (demo)</p>
        <span className="text-xs text-[#858090] dark:text-[#a39cab]">{DEMO_ACCOUNT.card}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {QUICK_PAYMENTS.map((payment) => (
          <button
            key={payment.counterparty}
            onClick={() => pay(payment.counterparty, payment.amountBani)}
            disabled={pending}
            className="pulse-hover rounded-xl bg-[#f1effa] px-3 py-2.5 text-left text-xs font-semibold text-[#33256c] disabled:opacity-60 dark:bg-[#2b253a] dark:text-white"
          >
            {payment.counterparty}
            <span className="block font-normal text-[#706b7b] dark:text-[#aaa4b6]">{formatRon(payment.amountBani)}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          aria-label="Shop"
          placeholder="Shop"
          value={shop}
          maxLength={40}
          onChange={(e) => setShop(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-[#e2dfe8] bg-[#f1effa]/40 px-3 py-2.5 text-base outline-none focus:border-[#6f5cc1] dark:border-[#353042] dark:bg-[#2b253a]/40"
        />
        <input
          aria-label="Amount in RON"
          placeholder="RON"
          inputMode="decimal"
          value={amountRon}
          onChange={(e) => setAmountRon(e.target.value)}
          className="w-24 rounded-xl border border-[#e2dfe8] bg-[#f1effa]/40 px-3 py-2.5 text-base outline-none focus:border-[#6f5cc1] dark:border-[#353042] dark:bg-[#2b253a]/40"
        />
        <button
          onClick={() => pay(shop.trim(), customAmountBani)}
          disabled={pending || !customValid}
          className="pulse-hover rounded-xl bg-[#33256c] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Pay
        </button>
      </div>

      {last && (
        <p key={`${last.counterparty}-${last.amountBani}-${last.roundupBani}`} className="rounded-xl bg-[#e3f5e9] px-3.5 py-2.5 text-sm text-[#236243] animate-in fade-in slide-in-from-top-2 duration-300 dark:bg-[#1e3629] dark:text-[#bfe8d1]">
          {last.counterparty} {formatRon(last.amountBani)} → <b>+{formatRon(last.roundupBani)}</b> for your retirement
        </p>
      )}
    </Card>
  )
}
