'use server'

// The payment card (Stripe, test mode): save one, remove it, and pay a month's amount
// with it. The card digits never touch our server: the browser sends them straight to
// Stripe (Stripe Elements), and we keep only Stripe's ids + brand + last 4 digits.
import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { rebuildJar, monthRange } from '@/lib/server/jar'
import { MAX_OFFER_MULTIPLE, answerOffer, collectJar } from '@/lib/server/money-flow'
import { STRIPE_CURRENCY, getStripe } from '@/lib/server/stripe'
import { unwrap } from '@/lib/server/unwrap'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  return data.user
}

/** The user's Stripe customer, created on first use. */
async function customerFor(userId: string, email: string | undefined) {
  const db = createAdminClient()
  const profile = unwrap(await db.from('profiles').select('stripe_customer_id, full_name').eq('id', userId).single())
  if (profile.stripe_customer_id) return profile.stripe_customer_id

  const customer = await getStripe().customers.create({
    email,
    name: profile.full_name ?? undefined,
    metadata: { user_id: userId },
  })
  unwrap(await db.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId))
  return customer.id
}

/** Step 1 of "Add a card": a SetupIntent the card form confirms in the browser. */
export async function startCardSetup(): Promise<{ clientSecret: string }> {
  const user = await requireUser()
  const customer = await customerFor(user.id, user.email)
  const setupIntent = await getStripe().setupIntents.create({
    customer,
    allowed_payment_method_types: ['card'],
    usage: 'off_session', // we charge it later, once a month, after the user's yes
  })
  return { clientSecret: setupIntent.client_secret! }
}

/** Step 2: Stripe confirmed the card; remember it (brand + last 4 only). */
export async function saveCard(setupIntentId: string) {
  const user = await requireUser()
  const db = createAdminClient()
  const profile = unwrap(await db.from('profiles').select('stripe_customer_id, stripe_payment_method_id').eq('id', user.id).single())

  const stripe = getStripe()
  const setupIntent = await stripe.setupIntents.retrieve(z.string().startsWith('seti_').parse(setupIntentId))
  // Only a confirmed SetupIntent of this user's own customer counts.
  if (setupIntent.customer !== profile.stripe_customer_id || setupIntent.status !== 'succeeded' || !setupIntent.payment_method) {
    throw new Error('Card setup not confirmed')
  }
  const paymentMethodId = typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : setupIntent.payment_method.id
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

  // One card at a time: the old one is removed from Stripe.
  if (profile.stripe_payment_method_id && profile.stripe_payment_method_id !== paymentMethodId) {
    await stripe.paymentMethods.detach(profile.stripe_payment_method_id).catch(() => {})
  }
  unwrap(
    await db
      .from('profiles')
      .update({
        stripe_payment_method_id: paymentMethodId,
        card_brand: paymentMethod.card?.brand ?? null,
        card_last4: paymentMethod.card?.last4 ?? null,
      })
      .eq('id', user.id),
  )
  refresh()
}

export async function removeCard() {
  const user = await requireUser()
  const db = createAdminClient()
  const profile = unwrap(await db.from('profiles').select('stripe_payment_method_id').eq('id', user.id).single())
  if (profile.stripe_payment_method_id) {
    await getStripe().paymentMethods.detach(profile.stripe_payment_method_id).catch(() => {})
  }
  unwrap(await db.from('profiles').update({ stripe_payment_method_id: null, card_brand: null, card_last4: null }).eq('id', user.id))
  refresh()
}

export type CardPaymentResult =
  | { status: 'paid' }
  | { status: 'requires_action'; clientSecret: string; paymentIntentId: string }
  | { status: 'failed'; message: string }

const PayInput = z.object({
  jarId: z.uuid(),
  amountBani: z.number().int().positive().optional(),
})

/**
 * "Yes, add it" with a saved card: charge the month's amount (test mode), then accept and
 * collect the month as usual. If the bank asks for 3-D Secure, the browser finishes it
 * and calls completeCardPayment.
 */
export async function payMonthWithCard(input: z.infer<typeof PayInput>): Promise<CardPaymentResult> {
  const user = await requireUser()
  const { jarId, amountBani } = PayInput.parse(input)
  const db = createAdminClient()

  const [jar, profile] = await Promise.all([
    db.from('monthly_jars').select('id, month, status, total_bani').eq('id', jarId).eq('user_id', user.id).single().then(unwrap),
    db.from('profiles').select('stripe_customer_id, stripe_payment_method_id').eq('id', user.id).single().then(unwrap),
  ])
  if (jar.status !== 'offered') return { status: 'failed', message: 'This month was already answered.' }
  if (!profile.stripe_customer_id || !profile.stripe_payment_method_id) return { status: 'failed', message: 'Add a card in Profile first.' }

  const amount = amountBani ?? jar.total_bani
  if (amount > jar.total_bani * MAX_OFFER_MULTIPLE) return { status: 'failed', message: 'That amount is too high.' }

  try {
    const paymentIntent = await getStripe().paymentIntents.create(
      {
        amount,
        currency: STRIPE_CURRENCY,
        customer: profile.stripe_customer_id,
        payment_method: profile.stripe_payment_method_id,
        off_session: true,
        confirm: true,
        description: `LifeGrowth ${jar.month} → Pillar III (held one month)`,
        metadata: { jar_id: jar.id, user_id: user.id, month: jar.month },
      },
      // Pressing Yes twice can't charge twice (a new card or amount is a new attempt).
      { idempotencyKey: `jar-${jar.id}-${amount}-${profile.stripe_payment_method_id}` },
    )
    if (paymentIntent.status === 'succeeded') {
      await acceptPaidMonth(user.id, jar.id, jar.month, amount, paymentIntent.id)
      refresh()
      return { status: 'paid' }
    }
    return { status: 'failed', message: 'The payment did not go through. Try again or use another card.' }
  } catch (error) {
    // 3-D Secure needed: Stripe returns the PaymentIntent inside the error.
    const stripeError = error as { code?: string; payment_intent?: { id: string; client_secret: string | null } }
    if (stripeError.code === 'authentication_required' && stripeError.payment_intent?.client_secret) {
      return { status: 'requires_action', clientSecret: stripeError.payment_intent.client_secret, paymentIntentId: stripeError.payment_intent.id }
    }
    if (stripeError.payment_intent?.id) {
      unwrap(await db.from('monthly_jars').update({ stripe_payment_intent_id: stripeError.payment_intent.id, payment_status: 'failed' }).eq('id', jar.id))
    }
    return { status: 'failed', message: 'Your card was declined. Try another card in Profile.' }
  }
}

/** After 3-D Secure in the browser: check with Stripe that it really was paid, then accept. */
export async function completeCardPayment(paymentIntentId: string): Promise<CardPaymentResult> {
  const user = await requireUser()
  const paymentIntent = await getStripe().paymentIntents.retrieve(z.string().startsWith('pi_').parse(paymentIntentId))
  const jarId = paymentIntent.metadata.jar_id
  if (paymentIntent.metadata.user_id !== user.id || !jarId) return { status: 'failed', message: 'Unknown payment.' }
  if (paymentIntent.status !== 'succeeded') return { status: 'failed', message: 'The payment was not confirmed.' }

  const db = createAdminClient()
  const jar = unwrap(await db.from('monthly_jars').select('id, month, status').eq('id', jarId).eq('user_id', user.id).single())
  if (jar.status === 'offered') await acceptPaidMonth(user.id, jar.id, jar.month, paymentIntent.amount, paymentIntent.id)
  refresh()
  return { status: 'paid' }
}

/** Paid: the month is accepted, collected (we hold it one month) and the next month opens. */
async function acceptPaidMonth(userId: string, jarId: string, month: string, amountBani: number, paymentIntentId: string) {
  const db = createAdminClient()
  await answerOffer(db, userId, jarId, { accept: true, amountBani })
  await collectJar(db, jarId, new Date().toISOString().slice(0, 10))
  unwrap(await db.from('monthly_jars').update({ stripe_payment_intent_id: paymentIntentId, payment_status: 'succeeded' }).eq('id', jarId))
  await rebuildJar(db, userId, monthRange(month).end.slice(0, 7))
}
