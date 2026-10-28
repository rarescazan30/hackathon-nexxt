// Stripe, test mode only (docs/STRIPE_TESTING.md). Server only: the secret key never
// reaches the browser. The client is created lazily, so builds work without keys.
import Stripe from 'stripe'

let client: Stripe | null = null

/** Both keys are set: the card form (publishable key) and charges (secret key) can work. */
export function stripeIsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set (see docs/STRIPE_TESTING.md)')
  // Live keys are refused: this app only ever moves test money.
  if (!key.startsWith('sk_test_')) throw new Error('Only Stripe test keys (sk_test_…) are allowed')
  client ??= new Stripe(key)
  return client
}

/** RON is a two-decimal currency, so Stripe's "smallest unit" is the ban, like our integers. */
export const STRIPE_CURRENCY = 'ron'
