import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY ?? '').trim(), {
  apiVersion: '2026-03-25.dahlia',
})

function serviceSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined } }
  )
}

async function upsertSubscription(
  userId: string,
  customerId: string,
  plan: 'pro' | 'free',
  status: string,
  expiresAt: Date | null
) {
  const db = serviceSupabase()
  await db.from('subscriptions').upsert({
    user_id:            userId,
    stripe_customer_id: customerId,
    plan,
    status,
    expires_at: expiresAt?.toISOString() ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const sig  = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] Stripe signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId  = session.client_reference_id
    const custId  = session.customer as string
    if (userId && custId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any
      const end = new Date(sub.current_period_end * 1000)
      await upsertSubscription(userId, custId, 'pro', 'active', end)
      console.log('[webhook] Pro activated for user', userId)
    } else {
      console.warn('[webhook] checkout.session.completed missing userId or custId', { userId, custId })
    }
  }

  if (event.type === 'customer.subscription.updated') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub    = event.data.object as any
    const custId = sub.customer as string
    const db     = serviceSupabase()
    const { data } = await db.from('subscriptions').select('user_id').eq('stripe_customer_id', custId).single()
    if (data?.user_id) {
      const end    = new Date(sub.current_period_end * 1000)
      const status = sub.status === 'active' ? 'active' : 'inactive'
      const plan   = sub.status === 'active' ? 'pro' : 'free'
      await upsertSubscription(data.user_id, custId, plan, status, end)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub    = event.data.object as any
    const custId = sub.customer as string
    const db     = serviceSupabase()
    const { data } = await db.from('subscriptions').select('user_id').eq('stripe_customer_id', custId).single()
    if (data?.user_id) {
      await upsertSubscription(data.user_id, custId, 'free', 'cancelled', null)
      console.log('[webhook] Subscription cancelled for user', data.user_id)
    }
  }

  return NextResponse.json({ received: true })
}
