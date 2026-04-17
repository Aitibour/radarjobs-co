import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
}

const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? '',
  annual:  process.env.STRIPE_PRICE_ANNUAL  ?? '',
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const { plan } = await req.json() as { plan: 'monthly' | 'annual' }
    const priceId = PRICES[plan]
    if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (n) => cookieStore.get(n)?.value } }
    )
    const { data: { user } } = await supabase.auth.getUser()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/scan?upgraded=1`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      ...(user ? { client_reference_id: user.id, customer_email: user.email } : {}),
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
