'use client'

// Profile → "Card and bank": two different things, shown apart on purpose.
//   Payment card (Stripe): how the monthly amount is paid when you say yes.
//   Bank connection (demo bank): where round-ups come from (your card payments).
import { useState, useTransition } from 'react'
import { CreditCard, Landmark } from 'lucide-react'
import type { AppData } from '@/lib/data/app-data'
import { connectCard } from '@/app/app/actions'
import { removeCard } from '@/app/app/card-actions'
import { Card } from '@/components/app/shell'
import { DEMO_ACCOUNT, DemoBank } from '@/components/bank/demo-bank'
import { CardForm } from '@/components/stripe/card-form'

const ROW = 'flex items-center gap-3'
const ICON = 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1effa] text-[#6f5cc1] dark:bg-[#2b253a]'
const ACTION = 'pulse-hover rounded-xl bg-[#f1effa] px-3 py-2 text-xs font-semibold text-[#5f4bb6] disabled:opacity-50 dark:bg-[#2b253a] dark:text-[#a594f0]'

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
          mode="consent"
          onClose={() => setConnectingBank(false)}
          onConfirm={() => {
            setConnectingBank(false)
            startTransition(() => connectCard())
          }}
        />
      )}

      <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Card and bank</p>

      <div className={ROW}>
        <span className={ICON}>
          <CreditCard size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{settings.card ? `${brandName(settings.card.brand)} •• ${settings.card.last4}` : 'Payment card'}</p>
          <p className="text-xs text-[#858090] dark:text-[#a39cab]">
            {settings.cardPaymentsReady ? 'Pays the monthly amount when you say yes' : 'Card payments are off (no Stripe test keys)'}
          </p>
        </div>
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

      <div className={ROW}>
        <span className={ICON}>
          <Landmark size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{settings.cardLinked ? `${DEMO_ACCOUNT.bank} · ${DEMO_ACCOUNT.card}` : 'Bank connection'}</p>
          <p className="text-xs text-[#858090] dark:text-[#a39cab]">Reads your card payments for round-ups (demo bank)</p>
        </div>
        {!settings.cardLinked && (
          <button onClick={() => setConnectingBank(true)} disabled={pending} className={ACTION}>
            Connect
          </button>
        )}
      </div>
    </Card>
  )
}
