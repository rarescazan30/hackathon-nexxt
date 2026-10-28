'use client'

// Profile → "Card and bank": two different jobs, explained side by side.
//   1. Payment card (Stripe): pays the monthly amount, only when you say yes.
//   2. Open Banking (demo): reads your card payments to calculate round-ups.
import { useState, useTransition } from 'react'
import { CreditCard, Landmark } from 'lucide-react'
import type { AppData } from '@/lib/data/app-data'
import { connectCard, disconnectBank } from '@/app/app/actions'
import { removeCard } from '@/app/app/card-actions'
import { Card } from '@/components/app/shell'
import { DemoBank, OPEN_BANKING } from '@/components/bank/demo-bank'
import { CardForm } from '@/components/stripe/card-form'

const ICON = 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1effa] text-[#6f5cc1] dark:bg-[#2b253a]'
const ACTION = 'pulse-hover shrink-0 rounded-xl bg-[#f1effa] px-3 py-2 text-xs font-semibold text-[#5f4bb6] disabled:opacity-50 dark:bg-[#2b253a] dark:text-[#a594f0]'
const ROLE = 'text-xs font-semibold text-[#5f4bb6] dark:text-[#a594f0]'

function brandName(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}

export function PaymentSettings({ settings }: { settings: AppData['settings'] }) {
  const [pending, startTransition] = useTransition()
  const [addingCard, setAddingCard] = useState(false)
  const [connectingBank, setConnectingBank] = useState(false)

  return (
    <Card className="flex flex-col gap-5">
      {addingCard && <CardForm onClose={() => setAddingCard(false)} />}
      {connectingBank && (
        <DemoBank
          onClose={() => setConnectingBank(false)}
          onConfirm={(choice) => {
            setConnectingBank(false)
            startTransition(() => connectCard(choice))
          }}
        />
      )}

      <div>
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Card and bank</p>
        <p className="mt-1 text-sm text-[#706b7b] dark:text-[#aaa4b6]">Two separate things: one pays, one reads.</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className={ROLE}>1 · Pays your monthly amount</p>
          {settings.card ? (
            <button onClick={() => startTransition(() => removeCard())} disabled={pending} className={ACTION}>
              Remove
            </button>
          ) : (
            <button onClick={() => setAddingCard(true)} disabled={!settings.cardPaymentsReady} className={ACTION}>
              Add a card
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={ICON}>
            <CreditCard size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{settings.card ? `${brandName(settings.card.brand)} •• ${settings.card.last4}` : 'Payment card (Stripe)'}</p>
            <p className="text-xs text-[#858090] dark:text-[#a39cab]">
              {settings.cardPaymentsReady ? 'Charged only when you say yes at the end of the month' : 'Card payments are off (no Stripe test keys)'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className={ROLE}>2 · Reads your payments for round-ups</p>
          {settings.cardLinked ? (
            <button onClick={() => startTransition(() => disconnectBank())} disabled={pending} className={ACTION}>
              {pending ? 'One moment…' : 'Disconnect'}
            </button>
          ) : (
            <button onClick={() => setConnectingBank(true)} disabled={pending} className={ACTION}>
              {pending ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={ICON}>
            <Landmark size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{settings.bank ? `${settings.bank.name} · card •• ${settings.bank.last4}` : OPEN_BANKING}</p>
            <p className="text-xs text-[#858090] dark:text-[#a39cab]">
              {settings.cardLinked
                ? 'Connected · read only, it can’t move money. Disconnect to use another card.'
                : 'Connect to see your payments and round-ups'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
