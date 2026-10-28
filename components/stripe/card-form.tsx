'use client'

// "Add a card": number, expiry, CVC (Stripe's own secure fields) and the name on the card.
// The digits go from these fields straight to Stripe; our server only sees the result.
import { useState } from 'react'
import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Lock, X } from 'lucide-react'
import { saveCard, startCardSetup } from '@/app/app/card-actions'
import { FormError } from '@/components/auth/form-parts'
import { PRIMARY_BUTTON } from '@/components/onboarding/onboarding-state'

let stripePromise: Promise<Stripe | null> | null = null
/** Loads Stripe.js once, only when a card form or payment needs it. */
export function getStripeJs() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) return Promise.resolve(null)
  stripePromise ??= loadStripe(key)
  return stripePromise
}

// The Stripe fields live in their own iframes, so they get their look from here, not CSS.
const ELEMENT_OPTIONS = {
  style: {
    base: { fontSize: '16px', color: '#292431', fontFamily: 'Arial, Helvetica, sans-serif', '::placeholder': { color: '#96909f' } },
    invalid: { color: '#b42318' },
  },
}
// Fixed light colours (no dark variants): the sheet is always light, like Stripe's fields.
const LIGHT_INPUT = 'w-full rounded-xl border border-[#e2dfe8] bg-[#f7f6f9] px-3.5 py-3 text-base text-[#292431] outline-none focus:border-[#6f5cc1]'
const LIGHT_LABEL = 'mb-1.5 block text-xs font-medium text-[#706b7b]'
const FIELD_BOX = `${LIGHT_INPUT} !py-3.5`

function CardFields({ onSaved }: { onSaved: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()

  async function submit() {
    const card = elements?.getElement(CardNumberElement)
    if (!stripe || !card) return
    setPending(true)
    setError(undefined)
    try {
      const { clientSecret } = await startCardSetup()
      // Stripe checks the card (and runs 3-D Secure if the bank wants it).
      const result = await stripe.confirmCardSetup(clientSecret, { payment_method: { card, billing_details: { name: name.trim() } } })
      if (result.error || !result.setupIntent) {
        setError(result.error?.message ?? 'The card could not be saved.')
        return
      }
      await saveCard(result.setupIntent.id)
      onSaved()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className={LIGHT_LABEL} htmlFor="card-name">Name on card</label>
        <input id="card-name" autoComplete="cc-name" className={LIGHT_INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="ANDREI POPESCU" />
      </div>
      <div>
        <span className={LIGHT_LABEL}>Card number</span>
        <div className={FIELD_BOX}>
          <CardNumberElement options={{ ...ELEMENT_OPTIONS, showIcon: true, disableLink: true }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <span className={LIGHT_LABEL}>Expiry (MM/YY)</span>
          <div className={FIELD_BOX}>
            <CardExpiryElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
        <div className="min-w-0">
          <span className={LIGHT_LABEL}>CVC</span>
          <div className={FIELD_BOX}>
            <CardCvcElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>
      <FormError message={error} />
      <button onClick={submit} disabled={!stripe || pending || name.trim().length < 2} className={PRIMARY_BUTTON}>
        {pending ? 'Checking your card…' : 'Save card'}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-[#858090]">
        <Lock size={12} /> Secured by Stripe · test mode, no real money
      </p>
    </div>
  )
}

/** The "Add a card" sheet. */
export function CardForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18151f]/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Add a card">
      {/* Always light: Stripe's fields are styled for a light background. */}
      <div className="w-full max-w-[430px] rounded-t-[28px] bg-white p-6 pb-[calc(24px+env(safe-area-inset-bottom))] text-[#292431] shadow-2xl animate-in slide-in-from-bottom-8 duration-300 sm:rounded-[28px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[.18em] text-[#8c7ad9]">Payment card</p>
            <h2 className="text-xl font-semibold tracking-[-.02em]">Add a card</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-full bg-[#f1effa]">
            <X size={16} />
          </button>
        </div>
        <Elements stripe={getStripeJs()}>
          <CardFields onSaved={onClose} />
        </Elements>
      </div>
    </div>
  )
}
