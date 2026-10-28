// POST /api/stripe/webhook: Stripe tells us how a monthly card payment ended.
// Trust nothing before the signature check; each event id is handled only once.
import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/server/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const PAYMENT_STATUS: Partial<Record<Stripe.Event['type'], 'succeeded' | 'failed'>> = {
  'payment_intent.succeeded': 'succeeded',
  'payment_intent.payment_failed': 'failed',
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')
  if (!secret || !signature) return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })

  let event: Stripe.Event
  try {
    // The raw body, exactly as sent: re-encoded JSON would break the signature.
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  }

  const db = createAdminClient()
  // Stripe retries: a second delivery of the same event is ignored.
  const { error: duplicate } = await db.from('stripe_events').insert({ id: event.id, type: event.type })
  if (duplicate) return NextResponse.json({ received: true, duplicate: true })

  const status = PAYMENT_STATUS[event.type]
  if (status) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const jarId = paymentIntent.metadata?.jar_id
    if (jarId) {
      await db
        .from('monthly_jars')
        .update({ stripe_payment_intent_id: paymentIntent.id, payment_status: status })
        .eq('id', jarId)
        .eq('user_id', paymentIntent.metadata.user_id ?? '')
    }
  }
  return NextResponse.json({ received: true })
}
